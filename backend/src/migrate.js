import pool from "./DataBase/db.js";

async function migrate() {
  console.log("Dropping legacy tables...");
  await pool.query(`
    DROP TABLE IF EXISTS message_status CASCADE;
    DROP TABLE IF EXISTS user_status CASCADE;
    DROP TABLE IF EXISTS contacts CASCADE;
    DROP TABLE IF EXISTS conversation_members CASCADE;
    DROP TABLE IF EXISTS messages CASCADE;
    DROP TABLE IF EXISTS conversations CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `);
  console.log("All legacy tables dropped.");
  process.exit(0);
}

migrate().catch(err => { console.error(err); process.exit(1); });
