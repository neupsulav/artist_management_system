const db = require("../db");
const { getRequestBody } = require("../utils/requestHelper");
const { parseCSV, generateCSV } = require("../utils/csvHelper");
const url = require("url");

const getArtists = async (req, res) => {
  try {
    const parsedUrl = url.parse(req.url, true);
    const page = parseInt(parsedUrl.query.page) || 1;
    const limit = parseInt(parsedUrl.query.limit) || 10;
    const offset = (page - 1) * limit;

    const countQuery = "SELECT COUNT(*) FROM artist";
    const totalResult = await db.query(countQuery);
    const total = parseInt(totalResult.rows[0].count);

    const query =
      "SELECT * FROM artist ORDER BY created_at DESC LIMIT $1 OFFSET $2";
    const result = await db.query(query, [limit, offset]);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        data: result.rows,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      }),
    );
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
};

const createArtist = async (req, res) => {
  try {
    const body = await getRequestBody(req);
    const {
      name,
      dob,
      gender,
      address,
      first_release_year,
      no_of_albums_released,
    } = body;

    // Validations
    if (!name) {
      throw new Error("Name is required");
    }

    if (gender && !["m", "f", "o"].includes(gender)) {
      throw new Error("Invalid gender. Must be m, f, or o");
    }

    if (
      first_release_year &&
      (isNaN(first_release_year) ||
        first_release_year < 1900 ||
        first_release_year > new Date().getFullYear())
    ) {
      throw new Error("Invalid first release year");
    }

    if (
      no_of_albums_released &&
      (isNaN(no_of_albums_released) || no_of_albums_released < 0)
    ) {
      throw new Error(
        "Number of albums released must be a non-negative integer",
      );
    }

    const query = `
      INSERT INTO artist (name, dob, gender, address, first_release_year, no_of_albums_released)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `;
    const result = await db.query(query, [
      name,
      dob,
      gender,
      address,
      first_release_year,
      no_of_albums_released,
    ]);

    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result.rows[0]));
  } catch (err) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
};

const updateArtist = async (req, res) => {
  try {
    const parsedUrl = url.parse(req.url, true);
    const id = parsedUrl.query.id;
    if (!id) throw new Error("Artist ID required");

    const body = await getRequestBody(req);
    const {
      name,
      dob,
      gender,
      address,
      first_release_year,
      no_of_albums_released,
    } = body;

    // Validations
    if (!name) {
      throw new Error("Name is required");
    }

    if (gender && !["m", "f", "o"].includes(gender)) {
      throw new Error("Invalid gender. Must be m, f, or o");
    }

    if (
      first_release_year &&
      (isNaN(first_release_year) ||
        first_release_year < 1900 ||
        first_release_year > new Date().getFullYear())
    ) {
      throw new Error("Invalid first release year");
    }

    if (
      no_of_albums_released &&
      (isNaN(no_of_albums_released) || no_of_albums_released < 0)
    ) {
      throw new Error(
        "Number of albums released must be a non-negative integer",
      );
    }

    const query = `
      UPDATE artist SET name=$1, dob=$2, gender=$3, address=$4, first_release_year=$5, no_of_albums_released=$6, updated_at=NOW()
      WHERE id=$7 RETURNING *
    `;
    const result = await db.query(query, [
      name,
      dob,
      gender,
      address,
      first_release_year,
      no_of_albums_released,
      id,
    ]);

    if (result.rowCount === 0) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Artist not found" }));
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result.rows[0]));
  } catch (err) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
};

const deleteArtist = async (req, res) => {
  try {
    const parsedUrl = url.parse(req.url, true);
    const id = parsedUrl.query.id;
    await db.query("DELETE FROM artist WHERE id=$1", [id]);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Artist deleted" }));
  } catch (err) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
};

const exportArtists = async (req, res) => {
  try {
    const query = "SELECT * FROM artist";
    const result = await db.query(query);
    const headers = [
      "id",
      "name",
      "dob",
      "gender",
      "address",
      "first_release_year",
      "no_of_albums_released",
    ];
    const csv = generateCSV(headers, result.rows);

    res.writeHead(200, {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=artists.csv",
    });
    res.end(csv);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
};

const importArtists = async (req, res) => {
  try {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", async () => {
      try {
        const artists = parseCSV(body);
        for (const artist of artists) {
          const query = `
            INSERT INTO artist (name, dob, gender, address, first_release_year, no_of_albums_released)
            VALUES ($1, $2, $3, $4, $5, $6)
          `;
          await db.query(query, [
            artist.name,
            artist.dob || null,
            artist.gender || null,
            artist.address || null,
            parseInt(artist.first_release_year) || null,
            parseInt(artist.no_of_albums_released) || 0,
          ]);
        }
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Artists imported successfully" }));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "CSV Parse Error: " + err.message }));
      }
    });
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
};

module.exports = {
  getArtists,
  createArtist,
  updateArtist,
  deleteArtist,
  exportArtists,
  importArtists,
};
