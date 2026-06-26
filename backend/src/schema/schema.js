import pool from "../DataBase/db.js";

export async function initDb() {
  // Enable UUID extension
  await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

  // Users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      username      TEXT UNIQUE NOT NULL,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      profile_pic   TEXT DEFAULT '',
      about         TEXT DEFAULT 'Hey there! I am using WhatsApp.',
      online        BOOLEAN DEFAULT false,
      last_seen     TIMESTAMPTZ DEFAULT NOW(),
      created_at    TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Conversations table (1-to-1 and group)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS conversations (
      id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name          TEXT,
      is_group      BOOLEAN DEFAULT false,
      group_icon    TEXT DEFAULT '',
      created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Conversation members
  await pool.query(`
    CREATE TABLE IF NOT EXISTS conversation_members (
      id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      joined_at       TIMESTAMPTZ DEFAULT NOW(),
      is_admin        BOOLEAN DEFAULT false,
      UNIQUE(conversation_id, user_id)
    );
  `);

  // Messages table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content         TEXT NOT NULL DEFAULT '',
      type            TEXT NOT NULL DEFAULT 'text',
      media_url       TEXT DEFAULT '',
      reply_to        UUID REFERENCES messages(id) ON DELETE SET NULL,
      is_deleted      BOOLEAN DEFAULT false,
      is_edited       BOOLEAN DEFAULT false,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      updated_at      TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Message status (per recipient)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS message_status (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      message_id  UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
      user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status      TEXT NOT NULL DEFAULT 'sent',
      updated_at  TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(message_id, user_id)
    );
  `);

  // User status/stories
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_status (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content     TEXT DEFAULT '',
      media_url   TEXT DEFAULT '',
      type        TEXT DEFAULT 'text',
      viewers     UUID[] DEFAULT '{}',
      expires_at  TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Contacts table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      contact_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, contact_id)
    );
  `);

  // Migrate legacy tables if they exist (drop old schema)
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'messages' AND column_name = 'chat_id'
      ) THEN
        ALTER TABLE messages DROP COLUMN IF EXISTS chat_id;
        ALTER TABLE messages DROP COLUMN IF EXISTS sender_id CASCADE;
      END IF;
    END $$;
  `).catch(() => {});

  // Indexes for performance
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
    CREATE INDEX IF NOT EXISTS idx_conversation_members_user_id ON conversation_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_conversation_members_conv_id ON conversation_members(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_message_status_message_id ON message_status(message_id);
    CREATE INDEX IF NOT EXISTS idx_user_status_user_id ON user_status(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_status_expires ON user_status(expires_at);
  `);

  console.log("Database tables ready ✓");
}
