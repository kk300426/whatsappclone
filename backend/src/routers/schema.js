import pool from "../DataBase/db.js";

// ---------------------------------------------------------------------------
// initDb — runs once at server startup.
// Creates both tables and safely migrates any legacy schema in one transaction.
// ---------------------------------------------------------------------------
export async function initDb() {
  await pool.query(`
    -- 1. contacts table (no more messages JSONB column)
    CREATE TABLE IF NOT EXISTS contacts (
      id           SERIAL PRIMARY KEY,
      name         TEXT UNIQUE NOT NULL,
      last_message TEXT,
      time         TEXT NOT NULL,
      date         TEXT NOT NULL
    );

    -- 2. messages table — one row per message
    CREATE TABLE IF NOT EXISTS messages (
      id         SERIAL PRIMARY KEY,
      contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      text       TEXT    NOT NULL DEFAULT '',
      time       TEXT    NOT NULL,
      date       TEXT    NOT NULL
    );
  `);

  // 3. Remove stale constraint / column from older schema versions
  await pool.query(`
    ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_message_key;
  `);
  await pool.query(`
    ALTER TABLE contacts DROP COLUMN IF EXISTS message;
  `);

  // 4. Migrate existing JSONB messages → individual rows, then drop the column
  await pool.query(`
    DO $$
    DECLARE
      rec RECORD;
      msg JSONB;
    BEGIN
      -- Only run if the old messages JSONB column still exists
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'contacts' AND column_name = 'messages'
      ) THEN
        FOR rec IN SELECT id, messages FROM contacts
                   WHERE messages IS NOT NULL AND jsonb_array_length(messages) > 0
        LOOP
          FOR msg IN SELECT * FROM jsonb_array_elements(rec.messages)
          LOOP
            INSERT INTO messages (contact_id, text, time, date)
            VALUES (
              rec.id,
              COALESCE(msg->>'text', ''),
              COALESCE(msg->>'time', ''),
              COALESCE(msg->>'date', '')
            );
          END LOOP;
        END LOOP;

        ALTER TABLE contacts DROP COLUMN messages;
      END IF;
    END $$;
  `);

  // 5. Ensure last_message column exists on contacts (safety net)
  await pool.query(`
    ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_message TEXT;
  `);

  console.log("Database tables ready (contacts + messages)");
}

// ---------------------------------------------------------------------------
// Shared helper — builds the standard contact response shape.
// Fetches all message rows for a contact and attaches them as an array.
// Uses a single LEFT JOIN + json_agg so it is one round-trip to Postgres.
// ---------------------------------------------------------------------------
const CONTACT_WITH_MESSAGES_SQL = `
  SELECT
    c.id,
    c.name,
    c.last_message AS "lastMessage",
    c.time,
    c.date,
    COALESCE(
      json_agg(
        json_build_object(
          'id',   m.id,
          'text', m.text,
          'time', m.time,
          'date', m.date
        ) ORDER BY m.id ASC
      ) FILTER (WHERE m.id IS NOT NULL),
      '[]'::json
    ) AS messages
  FROM contacts c
  LEFT JOIN messages m ON m.contact_id = c.id
`;

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------
export const createEditDeleteContent = {

  // Insert or update a contact, then insert each new message as its own row.
  async createContent(user) {
    // Step 1 — upsert the contact (name is UNIQUE)
    const contactResult = await pool.query(
      `INSERT INTO contacts (name, last_message, time, date)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (name) DO UPDATE
         SET last_message = EXCLUDED.last_message,
             time         = EXCLUDED.time,
             date         = EXCLUDED.date
       RETURNING id`,
      [user.name, user.lastMessage ?? null, user.time, user.date]
    );
    const contactId = contactResult.rows[0].id;

    // Step 2 — insert each message as its own row in the messages table
    if (Array.isArray(user.messages) && user.messages.length > 0) {
      for (const msg of user.messages) {
        await pool.query(
          `INSERT INTO messages (contact_id, text, time, date)
           VALUES ($1, $2, $3, $4)`,
          [
            contactId,
            String(msg.text ?? ""),
            String(msg.time ?? user.time),
            String(msg.date ?? user.date)
          ]
        );
      }
    }

    // Step 3 — return the full contact + all its messages
    const result = await pool.query(
      `${CONTACT_WITH_MESSAGES_SQL}
       WHERE c.id = $1
       GROUP BY c.id, c.name, c.last_message, c.time, c.date`,
      [contactId]
    );
    return result.rows[0];
  },

  async getAllContacts() {
    const result = await pool.query(
      `${CONTACT_WITH_MESSAGES_SQL}
       GROUP BY c.id, c.name, c.last_message, c.time, c.date
       ORDER BY c.id ASC`
    );
    return result.rows;
  },

  async getContactsById(id) {
    const result = await pool.query(
      `${CONTACT_WITH_MESSAGES_SQL}
       WHERE c.id = $1
       GROUP BY c.id, c.name, c.last_message, c.time, c.date`,
      [id]
    );
    return result.rows[0];
  },

  async getContactsByname(name) {
    const result = await pool.query(
      `${CONTACT_WITH_MESSAGES_SQL}
       WHERE c.name = $1
       GROUP BY c.id, c.name, c.last_message, c.time, c.date`,
      [name]
    );
    return result.rows[0];
  }
};
