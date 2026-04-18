require("dotenv").config();
const mysql = require("mysql2/promise");

async function fixSchema() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });
  console.log("✅ Connected to DB");

  // 1. Backup old events table (if it exists with wrong columns)
  try {
    await conn.query("RENAME TABLE events TO events_old");
    console.log("📦 Old events table backed up as events_old");
  } catch (_) {
    console.log("ℹ️  No events table to rename (or already done)");
  }

  // 2. Create the correct events table matching backend admin.routes.js
  await conn.query(`
    CREATE TABLE IF NOT EXISTS events (
      id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      admin_id     BIGINT UNSIGNED NOT NULL,
      title        VARCHAR(255) NOT NULL,
      description  TEXT,
      sport_tag    VARCHAR(100),
      sport_id     INT UNSIGNED NULL,
      venue        VARCHAR(255),
      event_date   DATE,
      event_time   VARCHAR(50),
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("✅ events table created with correct schema");

  // 3. Ensure event_team_members table exists
  await conn.query(`
    CREATE TABLE IF NOT EXISTS event_team_members (
      id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      event_id         INT UNSIGNED NOT NULL,
      student_user_id  BIGINT UNSIGNED NOT NULL,
      sport_id         INT UNSIGNED NOT NULL,
      assigned_by      BIGINT UNSIGNED,
      assigned_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_event_student (event_id, student_user_id)
    )
  `);
  console.log("✅ event_team_members table ready");

  // 4. Fix notifications enum to include ANNOUNCEMENT
  try {
    await conn.query(`
      ALTER TABLE notifications 
      MODIFY COLUMN type ENUM('ENROLLMENT','SYSTEM','ANNOUNCEMENT') NOT NULL DEFAULT 'SYSTEM'
    `);
    console.log("✅ notifications.type enum updated (added ANNOUNCEMENT)");
  } catch (e) {
    console.log("ℹ️  notifications.type enum update:", e.message);
  }

  // 5. Verify final schemas
  const [evtCols] = await conn.query("SHOW COLUMNS FROM events");
  console.log("\nevents columns:", evtCols.map((c) => c.Field).join(", "));

  const [notifTypeCol] = await conn.query("SHOW COLUMNS FROM notifications WHERE Field = 'type'");
  console.log("notifications.type:", notifTypeCol[0]?.Type);

  await conn.end();
  console.log("\n🎉 Schema fix complete! You can now create events.");
}

fixSchema().catch((e) => {
  console.error("❌ ERROR:", e.message);
  process.exit(1);
});
