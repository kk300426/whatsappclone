import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import pool from "../DataBase/db.js";
import { initDb } from "../schema/schema.js";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "whatsapp_clone_jwt_secret_2024";
const UPLOADS_DIR = join(__dirname, "../../uploads");

if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] },
  maxHttpBufferSize: 10e6
});

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use("/uploads", express.static(UPLOADS_DIR));

// ── Auth Middleware ──────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// ── Helper: save base64 file ─────────────────────────────────────────────────
function saveBase64(base64String, ext = "jpg") {
  const matches = base64String.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  const data = matches ? matches[2] : base64String;
  const filename = `${uuidv4()}.${ext}`;
  writeFileSync(join(UPLOADS_DIR, filename), Buffer.from(data, "base64"));
  return `/uploads/${filename}`;
}

// ── Upload Media ─────────────────────────────────────────────────────────────
app.post("/upload", authMiddleware, (req, res) => {
  try {
    const { base64, ext } = req.body;
    if (!base64) return res.status(400).json({ error: "No file data" });
    const url = saveBase64(base64, ext || "jpg");
    res.json({ url });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /signup ─────────────────────────────────────────────────────────────
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password, profile_pic } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: "Username, email and password required" });

    const exists = await pool.query(
      "SELECT id FROM users WHERE email=$1 OR username=$2", [email, username]
    );
    if (exists.rows.length > 0)
      return res.status(409).json({ error: "Email or username already taken" });

    const password_hash = await bcrypt.hash(password, 12);
    let pic = "";
    if (profile_pic && profile_pic.startsWith("data:")) {
      pic = saveBase64(profile_pic, "jpg");
    }

    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password_hash, profile_pic)
       VALUES ($1, $2, $3, $4) RETURNING id, username, email, profile_pic, about, online, last_seen`,
      [username, email, password_hash, pic]
    );
    const user = rows[0];
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
    res.status(201).json({ user, token });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /login ──────────────────────────────────────────────────────────────
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const { rows } = await pool.query(
      "SELECT * FROM users WHERE email=$1", [email]
    );
    if (rows.length === 0)
      return res.status(401).json({ error: "Invalid email or password" });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ error: "Invalid email or password" });

    await pool.query("UPDATE users SET online=true, last_seen=NOW() WHERE id=$1", [user.id]);
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
    const { password_hash: _, ...safeUser } = user;
    res.json({ user: { ...safeUser, online: true }, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /me ──────────────────────────────────────────────────────────────────
app.get("/me", authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, username, email, profile_pic, about, online, last_seen FROM users WHERE id=$1",
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /me ──────────────────────────────────────────────────────────────────
app.put("/me", authMiddleware, async (req, res) => {
  try {
    const { username, about, profile_pic } = req.body;
    let pic = profile_pic;
    if (profile_pic && profile_pic.startsWith("data:")) {
      pic = saveBase64(profile_pic, "jpg");
    }
    const { rows } = await pool.query(
      `UPDATE users SET username=COALESCE($1,username), about=COALESCE($2,about), profile_pic=COALESCE($3,profile_pic)
       WHERE id=$4 RETURNING id, username, email, profile_pic, about, online, last_seen`,
      [username, about, pic, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /users?q=query ───────────────────────────────────────────────────────
app.get("/users", authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    const search = `%${(q || "").toLowerCase()}%`;
    const { rows } = await pool.query(
      `SELECT id, username, email, profile_pic, about, online, last_seen
       FROM users
       WHERE id != $1 AND (LOWER(username) LIKE $2 OR LOWER(email) LIKE $2)
       ORDER BY username LIMIT 30`,
      [req.user.id, search]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /conversations ───────────────────────────────────────────────────────
app.get("/conversations", authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         c.id, c.name, c.is_group, c.group_icon, c.updated_at,
         (
           SELECT json_build_object(
             'id', m.id, 'content', m.content, 'type', m.type,
             'sender_id', m.sender_id, 'created_at', m.created_at, 'is_deleted', m.is_deleted
           )
           FROM messages m
           WHERE m.conversation_id = c.id
           ORDER BY m.created_at DESC LIMIT 1
         ) AS last_message,
         (
           SELECT COUNT(*) FROM messages m2
           LEFT JOIN message_status ms ON ms.message_id = m2.id AND ms.user_id = $1
           WHERE m2.conversation_id = c.id
             AND m2.sender_id != $1
             AND (ms.status IS NULL OR ms.status != 'seen')
         ) AS unread_count,
         (
           SELECT json_agg(json_build_object(
             'id', u.id, 'username', u.username, 'profile_pic', u.profile_pic,
             'online', u.online, 'last_seen', u.last_seen, 'about', u.about
           ))
           FROM conversation_members cm2
           JOIN users u ON u.id = cm2.user_id
           WHERE cm2.conversation_id = c.id
         ) AS members
       FROM conversations c
       JOIN conversation_members cm ON cm.conversation_id = c.id AND cm.user_id = $1
       ORDER BY c.updated_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /conversations error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /conversations ──────────────────────────────────────────────────────
app.post("/conversations", authMiddleware, async (req, res) => {
  try {
    const { member_id, is_group, name, member_ids } = req.body;

    if (!is_group) {
      // Check existing 1-to-1
      const existing = await pool.query(
        `SELECT c.id FROM conversations c
         JOIN conversation_members cm1 ON cm1.conversation_id = c.id AND cm1.user_id = $1
         JOIN conversation_members cm2 ON cm2.conversation_id = c.id AND cm2.user_id = $2
         WHERE c.is_group = false`,
        [req.user.id, member_id]
      );
      if (existing.rows.length > 0) {
        const { rows } = await pool.query(
          `SELECT c.id, c.name, c.is_group, c.group_icon, c.updated_at,
             NULL AS last_message, 0 AS unread_count,
             (SELECT json_agg(json_build_object('id', u.id, 'username', u.username,
               'profile_pic', u.profile_pic, 'online', u.online, 'last_seen', u.last_seen, 'about', u.about))
              FROM conversation_members cm2
              JOIN users u ON u.id = cm2.user_id
              WHERE cm2.conversation_id = c.id
             ) AS members
           FROM conversations c WHERE c.id = $1`,
          [existing.rows[0].id]
        );
        return res.json(rows[0]);
      }

      const convRes = await pool.query(
        `INSERT INTO conversations (is_group) VALUES (false) RETURNING *`
      );
      const conv = convRes.rows[0];
      await pool.query(
        `INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1,$2),($1,$3)`,
        [conv.id, req.user.id, member_id]
      );

      // Add to contacts both ways
      await pool.query(
        `INSERT INTO contacts (user_id, contact_id) VALUES ($1,$2),($2,$1) ON CONFLICT DO NOTHING`,
        [req.user.id, member_id]
      );

      const { rows } = await pool.query(
        `SELECT c.id, c.name, c.is_group, c.group_icon, c.updated_at,
           NULL AS last_message, 0 AS unread_count,
           (SELECT json_agg(json_build_object('id', u.id, 'username', u.username,
             'profile_pic', u.profile_pic, 'online', u.online, 'last_seen', u.last_seen, 'about', u.about))
            FROM conversation_members cm2
            JOIN users u ON u.id = cm2.user_id
            WHERE cm2.conversation_id = c.id
           ) AS members
         FROM conversations c WHERE c.id = $1`,
        [conv.id]
      );
      return res.status(201).json(rows[0]);
    }

    // Group conversation
    const convRes = await pool.query(
      `INSERT INTO conversations (name, is_group, created_by) VALUES ($1, true, $2) RETURNING *`,
      [name, req.user.id]
    );
    const conv = convRes.rows[0];
    const allMembers = [...new Set([req.user.id, ...(member_ids || [])])];
    for (const uid of allMembers) {
      await pool.query(
        `INSERT INTO conversation_members (conversation_id, user_id, is_admin) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
        [conv.id, uid, uid === req.user.id]
      );
    }

    const { rows } = await pool.query(
      `SELECT c.id, c.name, c.is_group, c.group_icon, c.updated_at,
         NULL AS last_message, 0 AS unread_count,
         (SELECT json_agg(json_build_object('id', u.id, 'username', u.username,
           'profile_pic', u.profile_pic, 'online', u.online, 'last_seen', u.last_seen, 'about', u.about))
          FROM conversation_members cm2
          JOIN users u ON u.id = cm2.user_id
          WHERE cm2.conversation_id = c.id
         ) AS members
       FROM conversations c WHERE c.id = $1`,
      [conv.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("POST /conversations error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /messages/:conversationId ────────────────────────────────────────────
app.get("/messages/:conversationId", authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before;

    let query = `
      SELECT m.*,
        json_build_object('id', u.id, 'username', u.username, 'profile_pic', u.profile_pic) AS sender,
        (SELECT json_build_object('id', rm.id, 'content', rm.content, 'type', rm.type,
            'sender', json_build_object('username', ru.username))
         FROM messages rm JOIN users ru ON ru.id = rm.sender_id
         WHERE rm.id = m.reply_to) AS reply_message,
        COALESCE(
          json_agg(json_build_object('user_id', ms.user_id, 'status', ms.status))
          FILTER (WHERE ms.id IS NOT NULL), '[]'
        ) AS statuses
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      LEFT JOIN message_status ms ON ms.message_id = m.id
      WHERE m.conversation_id = $1 ${before ? "AND m.created_at < $3" : ""}
      GROUP BY m.id, u.id
      ORDER BY m.created_at DESC
      LIMIT $2
    `;
    const params = before ? [conversationId, limit, before] : [conversationId, limit];
    const { rows } = await pool.query(query, params);

    // Mark messages as delivered/seen
    const msgIds = rows.filter(m => m.sender_id !== req.user.id).map(m => m.id);
    for (const mid of msgIds) {
      await pool.query(
        `INSERT INTO message_status (message_id, user_id, status)
         VALUES ($1, $2, 'seen')
         ON CONFLICT (message_id, user_id) DO UPDATE SET status='seen', updated_at=NOW()`,
        [mid, req.user.id]
      );
    }

    // Notify senders of seen
    if (msgIds.length > 0) {
      io.to(`conv:${conversationId}`).emit("messages_seen", {
        conversation_id: conversationId,
        seen_by: req.user.id,
        message_ids: msgIds
      });
    }

    res.json(rows.reverse());
  } catch (err) {
    console.error("GET /messages error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /messages ───────────────────────────────────────────────────────────
app.post("/messages", authMiddleware, async (req, res) => {
  try {
    const { conversation_id, content, type, media_url, reply_to } = req.body;
    if (!conversation_id) return res.status(400).json({ error: "conversation_id required" });

    let url = media_url || "";
    if (url && url.startsWith("data:")) {
      const ext = type === "image" ? "jpg" : type === "voice" ? "mp3" : "bin";
      url = saveBase64(url, ext);
    }

    const { rows } = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, content, type, media_url, reply_to)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [conversation_id, req.user.id, content || "", type || "text", url, reply_to || null]
    );
    const message = rows[0];

    // Update conversation timestamp
    await pool.query("UPDATE conversations SET updated_at=NOW() WHERE id=$1", [conversation_id]);

    // Create sent status for sender
    await pool.query(
      `INSERT INTO message_status (message_id, user_id, status) VALUES ($1,$2,'sent') ON CONFLICT DO NOTHING`,
      [message.id, req.user.id]
    );

    // Fetch full message with sender info
    const { rows: full } = await pool.query(
      `SELECT m.*,
         json_build_object('id', u.id, 'username', u.username, 'profile_pic', u.profile_pic) AS sender,
         (SELECT json_build_object('id', rm.id, 'content', rm.content, 'type', rm.type,
             'sender', json_build_object('username', ru.username))
          FROM messages rm JOIN users ru ON ru.id = rm.sender_id
          WHERE rm.id = m.reply_to) AS reply_message,
         '[]'::json AS statuses
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.id = $1`,
      [message.id]
    );

    const fullMsg = full[0];
    // Broadcast to conversation room
    io.to(`conv:${conversation_id}`).emit("receive_message", fullMsg);

    res.status(201).json(fullMsg);
  } catch (err) {
    console.error("POST /messages error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /messages/:id ────────────────────────────────────────────────────────
app.put("/messages/:id", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const { rows } = await pool.query(
      `UPDATE messages SET content=$1, is_edited=true, updated_at=NOW()
       WHERE id=$2 AND sender_id=$3 RETURNING *`,
      [content, req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Message not found" });
    io.to(`conv:${rows[0].conversation_id}`).emit("message_updated", rows[0]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /messages/:id ─────────────────────────────────────────────────────
app.delete("/messages/:id", authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE messages SET is_deleted=true, content='This message was deleted', updated_at=NOW()
       WHERE id=$1 AND sender_id=$2 RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Message not found" });
    io.to(`conv:${rows[0].conversation_id}`).emit("message_deleted", {
      id: rows[0].id,
      conversation_id: rows[0].conversation_id
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /status ──────────────────────────────────────────────────────────────
app.get("/status", authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT us.*, json_build_object('id', u.id, 'username', u.username, 'profile_pic', u.profile_pic) AS user
       FROM user_status us
       JOIN users u ON u.id = us.user_id
       JOIN contacts c ON c.contact_id = us.user_id AND c.user_id = $1
       WHERE us.expires_at > NOW()
       ORDER BY us.created_at DESC`,
      [req.user.id]
    );

    // Also include own status
    const { rows: myStatus } = await pool.query(
      `SELECT us.*, json_build_object('id', u.id, 'username', u.username, 'profile_pic', u.profile_pic) AS user
       FROM user_status us
       JOIN users u ON u.id = us.user_id
       WHERE us.user_id = $1 AND us.expires_at > NOW()
       ORDER BY us.created_at DESC`,
      [req.user.id]
    );

    res.json([...myStatus, ...rows]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /status ─────────────────────────────────────────────────────────────
app.post("/status", authMiddleware, async (req, res) => {
  try {
    const { content, media_url, type } = req.body;
    let url = media_url || "";
    if (url && url.startsWith("data:")) {
      url = saveBase64(url, "jpg");
    }
    const { rows } = await pool.query(
      `INSERT INTO user_status (user_id, content, media_url, type) VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.user.id, content || "", url, type || "text"]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Socket.IO ────────────────────────────────────────────────────────────────
const connectedUsers = new Map(); // userId -> Set<socketId>

io.on("connection", (socket) => {
  let userId = null;

  socket.on("user_online", async (uid) => {
    userId = uid;
    if (!connectedUsers.has(uid)) connectedUsers.set(uid, new Set());
    connectedUsers.get(uid).add(socket.id);

    await pool.query("UPDATE users SET online=true, last_seen=NOW() WHERE id=$1", [uid]).catch(() => {});
    io.emit("user_status_change", { user_id: uid, online: true });
    console.log(`User online: ${uid}`);
  });

  socket.on("join_conversation", (conversationId) => {
    socket.join(`conv:${conversationId}`);
  });

  socket.on("leave_conversation", (conversationId) => {
    socket.leave(`conv:${conversationId}`);
  });

  socket.on("typing", ({ conversation_id, user_id, username }) => {
    socket.to(`conv:${conversation_id}`).emit("user_typing", { conversation_id, user_id, username });
  });

  socket.on("stop_typing", ({ conversation_id, user_id }) => {
    socket.to(`conv:${conversation_id}`).emit("user_stop_typing", { conversation_id, user_id });
  });

  socket.on("message_delivered", async ({ message_id, conversation_id, user_id }) => {
    await pool.query(
      `INSERT INTO message_status (message_id, user_id, status)
       VALUES ($1,$2,'delivered')
       ON CONFLICT (message_id, user_id) DO UPDATE SET status='delivered', updated_at=NOW()
       WHERE message_status.status != 'seen'`,
      [message_id, user_id]
    ).catch(() => {});
    io.to(`conv:${conversation_id}`).emit("message_status_update", {
      message_id, user_id, status: "delivered"
    });
  });

  socket.on("message_seen", async ({ message_id, conversation_id, user_id }) => {
    await pool.query(
      `INSERT INTO message_status (message_id, user_id, status)
       VALUES ($1,$2,'seen')
       ON CONFLICT (message_id, user_id) DO UPDATE SET status='seen', updated_at=NOW()`,
      [message_id, user_id]
    ).catch(() => {});
    io.to(`conv:${conversation_id}`).emit("message_status_update", {
      message_id, user_id, status: "seen"
    });
  });

  socket.on("disconnect", async () => {
    if (userId) {
      const sockets = connectedUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          connectedUsers.delete(userId);
          await pool.query(
            "UPDATE users SET online=false, last_seen=NOW() WHERE id=$1", [userId]
          ).catch(() => {});
          io.emit("user_status_change", { user_id: userId, online: false, last_seen: new Date() });
        }
      }
    }
  });
});

// ── Start server ─────────────────────────────────────────────────────────────
initDb()
  .then(() => {
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
