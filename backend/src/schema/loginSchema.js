import pool from "../DataBase/db.js";

export const createEditDeleteContent = {
  async createContent(user) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `);

    const result = await pool.query(
      `INSERT INTO users (username, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, username, email`,
      [user.username, user.email, user.password]
    );

    return result.rows[0];
  },
 async getAllUsers() {
    const result = await pool.query(
      "SELECT id, username, email ,password FROM users"
    );
    return result.rows;
  },

  async getUserById(id) {
    const result = await pool.query(
      "SELECT id, username, email ,password FROM users WHERE id = $1",
      [id]
    );
    return result.rows[0];
  },
  async getUserByEmail(email) {
    const result = await pool.query(
      "SELECT id, username, email ,password FROM users WHERE email = $1",
      [email]
    );
    return result.rows[0];
  }
};