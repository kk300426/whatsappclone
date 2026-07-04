import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

pool.on('connect', () => {
    console.log("Database connected");
});

pool.on('error', (err) => {
    console.log("Error connecting DB", err);
});

export default pool;
