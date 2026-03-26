const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { getRequestBody } = require("../utils/requestHelper");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "secret";

const register = async (req, res) => {
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

    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO "user" (first_name, last_name, email, password, phone, dob, gender, address, role)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, email, role
    `;
    const values = [
      first_name,
      last_name,
      email,
      hashedPassword,
      phone,
      dob,
      gender,
      address,
      role || "artist",
    ];

    const result = await db.query(query, values);
    const newUser = result.rows[0];

    // If role is artist, automatically create artist profile with same ID
    if (role === "artist") {
      const artistQuery = `
        INSERT INTO artist (id, name, dob, gender, address)
        VALUES ($1, $2, $3, $4, $5)
      `;
      await db.query(artistQuery, [
        newUser.id,
        `${first_name} ${last_name}`,
        dob || null,
        gender || null,
        address || null,
      ]);
    }

    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify(newUser));
  } catch (err) {
    console.error(err);
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Registration failed: " + err.message }));
  }
};

const login = async (req, res) => {
  try {
    const body = await getRequestBody(req);
    const { email, password } = body;

    const query = 'SELECT * FROM "user" WHERE email = $1';
    const result = await db.query(query, [email]);
    const user = result.rows[0];

    // console.log("Query result:", result.rows);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      // const ismatch = await bcrypt.compare(password, user.password);
      // console.log("Is password match: ", ismatch);
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Invalid email or password" }));
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "1d",
    });

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          first_name: user.first_name,
        },
      }),
    );
  } catch (err) {
    console.error(err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Login failed" }));
  }
};

module.exports = { register, login };
