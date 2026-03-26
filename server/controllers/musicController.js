const db = require("../db");
const { getRequestBody } = require("../utils/requestHelper");
const url = require("url");

const checkArtistOwnership = async (user, artistId) => {
  if (user.role === "artist") {
    if (parseInt(user.id) !== parseInt(artistId)) {
      throw new Error(
        "Forbidden: You can only manage songs for your own artist profile",
      );
    }
  }
};

const getMusic = async (req, res) => {
  try {
    const parsedUrl = url.parse(req.url, true);
    const artistId = parsedUrl.query.artist_id;
    if (!artistId) throw new Error("Artist ID required");

    const query =
      "SELECT * FROM music WHERE artist_id = $1 ORDER BY created_at DESC";
    const result = await db.query(query, [artistId]);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result.rows));
  } catch (err) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
};

const createMusic = async (req, res) => {
  try {
    const body = await getRequestBody(req);
    const { artist_id, title, album_name, genre } = body;

    // RBAC: Artist can only create songs for themselves
    await checkArtistOwnership(req.user, artist_id);

    // Validations
    if (!artist_id || !title || !genre) {
      throw new Error(
        "Missing required fields: artist_id, title, genre are required",
      );
    }

    if (!["rnb", "country", "classic", "rock", "jazz"].includes(genre)) {
      throw new Error("Invalid genre");
    }

    const query = `
      INSERT INTO music (artist_id, title, album_name, genre)
      VALUES ($1, $2, $3, $4) RETURNING *
    `;
    const result = await db.query(query, [artist_id, title, album_name, genre]);

    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result.rows[0]));
  } catch (err) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
};

const updateMusic = async (req, res) => {
  try {
    const parsedUrl = url.parse(req.url, true);
    const id = parsedUrl.query.id;
    if (!id) throw new Error("Music ID required");

    const body = await getRequestBody(req);
    const { title, album_name, genre } = body;

    // RBAC: Artist can only update their own songs
    const songCheck = await db.query(
      "SELECT artist_id FROM music WHERE id = $1",
      [id],
    );
    if (songCheck.rowCount > 0) {
      await checkArtistOwnership(req.user, songCheck.rows[0].artist_id);
    }

    // Validations
    if (!title || !genre) {
      throw new Error("Missing required fields: title, genre are required");
    }

    if (!["rnb", "country", "classic", "rock", "jazz"].includes(genre)) {
      throw new Error("Invalid genre");
    }

    const query = `
      UPDATE music SET title=$1, album_name=$2, genre=$3, updated_at=NOW()
      WHERE id=$4 RETURNING *
    `;
    const result = await db.query(query, [title, album_name, genre, id]);

    if (result.rowCount === 0) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Music not found" }));
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result.rows[0]));
  } catch (err) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
};

const deleteMusic = async (req, res) => {
  try {
    const parsedUrl = url.parse(req.url, true);
    const id = parsedUrl.query.id;
    if (!id) throw new Error("Music ID required");

    // RBAC: Artist can only delete their own songs
    const songCheck = await db.query(
      "SELECT artist_id FROM music WHERE id = $1",
      [id],
    );
    if (songCheck.rowCount > 0) {
      await checkArtistOwnership(req.user, songCheck.rows[0].artist_id);
    }

    await db.query("DELETE FROM music WHERE id=$1", [id]);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Music deleted" }));
  } catch (err) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
};

module.exports = { getMusic, createMusic, updateMusic, deleteMusic };
