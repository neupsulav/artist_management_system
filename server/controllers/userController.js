const db = require("../db");
const bcrypt = require("bcryptjs");
const { getRequestBody } = require("../utils/requestHelper");
const url = require("url");

const getUsers = async (req, res) => {
  try {
    const parsedUrl = url.parse(req.url, true);
    const page = parseInt(parsedUrl.query.page) || 1;
    const limit = parseInt(parsedUrl.query.limit) || 10;
    const offset = (page - 1) * limit;

    const countQuery = 'SELECT COUNT(*) FROM "user"';
    const totalResult = await db.query(countQuery);
    const total = parseInt(totalResult.rows[0].count);

    const query = `
      SELECT id, first_name, last_name, email, phone, dob, gender, address, role, created_at 
      FROM "user" 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;
    const result = await db.query(query, [limit, offset]);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        data: result.rows,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      }),
    );
  } catch (err) {
    console.error(err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Failed to fetch users" }));
  }
};

const createUser = async (req, res) => {
  try {
    const body = await getRequestBody(req);
    const {
      first_name,
      last_name,
      email,
      password,
      phone,
      dob,
      gender,
      address,
      role,
    } = body;

    // Validations
    if (!first_name || !last_name || !email || !password || !role) {
      throw new Error(
        "Missing required fields: first_name, last_name, email, password, role are required",
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    if (gender && !["m", "f", "o"].includes(gender)) {
      throw new Error("Invalid gender. Must be m, f, or o");
    }

    if (!["super_admin", "artist_manager", "artist"].includes(role)) {
      throw new Error("Invalid role");
    }

    // Check email uniqueness
    const emailCheck = await db.query(
      'SELECT id FROM "user" WHERE email = $1',
      [email],
    );
    if (emailCheck.rowCount > 0) {
      throw new Error("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO "user" (first_name, last_name, email, password, phone, dob, gender, address, role)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, email, role
    `;
    const result = await db.query(query, [
      first_name,
      last_name,
      email,
      hashedPassword,
      phone,
      dob,
      gender,
      address,
      role,
    ]);

    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result.rows[0]));
  } catch (err) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
};

const updateUser = async (req, res) => {
  try {
    const parsedUrl = url.parse(req.url, true);
    const id = parsedUrl.query.id;
    if (!id) throw new Error("User ID required");

    const body = await getRequestBody(req);
    const { first_name, last_name, phone, dob, gender, address, role } = body;

    // Validations
    if (!first_name || !last_name || !role) {
      throw new Error(
        "Missing required fields: first_name, last_name, role are required",
      );
    }

    if (gender && !["m", "f", "o"].includes(gender)) {
      throw new Error("Invalid gender. Must be m, f, or o");
    }

    if (!["super_admin", "artist_manager", "artist"].includes(role)) {
      throw new Error("Invalid role");
    }

    const query = `
      UPDATE "user" 
      SET first_name=$1, last_name=$2, phone=$3, dob=$4, gender=$5, address=$6, role=$7, updated_at=NOW()
      WHERE id=$8 RETURNING id, email, role
    `;
    const result = await db.query(query, [
      first_name,
      last_name,
      phone,
      dob,
      gender,
      address,
      role,
      id,
    ]);

    if (result.rowCount === 0) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "User not found" }));
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result.rows[0]));
  } catch (err) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
};

const deleteUser = async (req, res) => {
  try {
    const parsedUrl = url.parse(req.url, true);
    const id = parsedUrl.query.id;
    if (!id) throw new Error("User ID required");

    const query = 'DELETE FROM "user" WHERE id=$1';
    await db.query(query, [id]);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "User deleted successfully" }));
  } catch (err) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };
