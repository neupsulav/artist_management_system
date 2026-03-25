const db = require("./server/db");
const bcrypt = require("bcryptjs");

async function seed() {
  try {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const query = `
      INSERT INTO "user" (first_name, last_name, email, password, role)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password
    `;
    const values = [
      "Super",
      "Admin",
      "admin@example.com",
      hashedPassword,
      "super_admin",
    ];

    await db.query(query, values);
    console.log(
      "Seeding successful: Admin user created (admin@example.com / admin123)",
    );
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();
