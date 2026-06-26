import pool from "./DataBase/db.js";

async function check() {
  try {
    const res = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'messages'"
    );
    console.log("Columns of 'messages' table:", res.rows);
  } catch (err) {
    console.error("Error querying schema:", err);
  } finally {
    process.exit(0);
  }
}

check();
