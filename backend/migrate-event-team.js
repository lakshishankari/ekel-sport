require("dotenv").config();
const { pool } = require("./src/db");

async function migrate() {
  console.log("\n=== Migrating event_team_members table ===\n");

  // 1. Show current columns
  const [cols] = await pool.query("DESCRIBE event_team_members");
  console.log("Current columns:", cols.map(c => c.Field).join(", "));

  const hasEventId   = cols.some(c => c.Field === "event_id");
  const hasSportId   = cols.some(c => c.Field === "sport_id");
  const hasAssignedBy= cols.some(c => c.Field === "assigned_by");
  const hasAssignedAt= cols.some(c => c.Field === "assigned_at");

  // 2. Drop the old FK constraint on event_division_id (if exists)
  try {
    await pool.query("ALTER TABLE event_team_members DROP FOREIGN KEY event_team_members_ibfk_1");
    console.log("✅ Dropped FK event_team_members_ibfk_1");
  } catch (e) {
    console.log("ℹ️  FK drop skipped:", e.message);
  }

  // 3. Add event_id column if missing
  if (!hasEventId) {
    await pool.query("ALTER TABLE event_team_members ADD COLUMN event_id INT UNSIGNED NULL AFTER id");
    console.log("✅ Added event_id column");
  } else {
    console.log("ℹ️  event_id already exists");
  }

  // 4. Add sport_id column if missing
  if (!hasSportId) {
    await pool.query("ALTER TABLE event_team_members ADD COLUMN sport_id INT UNSIGNED NULL AFTER student_user_id");
    console.log("✅ Added sport_id column");
  } else {
    console.log("ℹ️  sport_id already exists");
  }

  // 5. Add assigned_by column if missing
  if (!hasAssignedBy) {
    await pool.query("ALTER TABLE event_team_members ADD COLUMN assigned_by BIGINT UNSIGNED NULL");
    console.log("✅ Added assigned_by column");
  } else {
    console.log("ℹ️  assigned_by already exists");
  }

  // 6. Add assigned_at column if missing
  if (!hasAssignedAt) {
    await pool.query("ALTER TABLE event_team_members ADD COLUMN assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    console.log("✅ Added assigned_at column");
  } else {
    console.log("ℹ️  assigned_at already exists");
  }

  // 7. Back-fill event_id from event_divisions (for old rows that have event_division_id)
  try {
    const [updated] = await pool.query(`
      UPDATE event_team_members etm
      JOIN event_divisions ed ON ed.id = etm.event_division_id
      SET etm.event_id = ed.event_id
      WHERE etm.event_id IS NULL AND etm.event_division_id IS NOT NULL
    `);
    console.log(`✅ Back-filled event_id for ${updated.affectedRows} rows`);
  } catch (e) {
    console.log("ℹ️  Back-fill skipped:", e.message);
  }

  // 8. Back-fill sport_id from events (for rows that now have event_id)
  try {
    const [updated2] = await pool.query(`
      UPDATE event_team_members etm
      JOIN events e ON e.id = etm.event_id
      SET etm.sport_id = e.sport_id
      WHERE etm.sport_id IS NULL AND etm.event_id IS NOT NULL AND e.sport_id IS NOT NULL
    `);
    console.log(`✅ Back-filled sport_id for ${updated2.affectedRows} rows`);
  } catch (e) {
    console.log("ℹ️  sport_id back-fill skipped:", e.message);
  }

  // 9. Make event_id NOT NULL (only if all rows are back-filled)
  try {
    const [[{ nullCount }]] = await pool.query(
      "SELECT COUNT(*) AS nullCount FROM event_team_members WHERE event_id IS NULL"
    );
    if (nullCount === 0) {
      await pool.query("ALTER TABLE event_team_members MODIFY event_id INT UNSIGNED NOT NULL");
      console.log("✅ event_id set to NOT NULL");
    } else {
      // Delete orphaned rows that couldn't be backfilled
      await pool.query("DELETE FROM event_team_members WHERE event_id IS NULL");
      console.log(`⚠️  Deleted ${nullCount} orphaned rows with no event_id`);
      await pool.query("ALTER TABLE event_team_members MODIFY event_id INT UNSIGNED NOT NULL");
      console.log("✅ event_id set to NOT NULL");
    }
  } catch (e) {
    console.log("ℹ️  NOT NULL constraint skipped:", e.message);
  }

  // 10. Add UNIQUE KEY on (event_id, student_user_id) if it doesn't already exist
  try {
    await pool.query("ALTER TABLE event_team_members ADD UNIQUE KEY uq_event_student (event_id, student_user_id)");
    console.log("✅ Added UNIQUE KEY uq_event_student");
  } catch (e) {
    console.log("ℹ️  UNIQUE KEY skipped:", e.message);
  }

  // 11. Show final schema
  const [finalCols] = await pool.query("DESCRIBE event_team_members");
  console.log("\nFinal columns:");
  finalCols.forEach(c => console.log(`  ${c.Field.padEnd(20)} ${c.Type.padEnd(20)} NULL=${c.Null} DEFAULT=${c.Default ?? "none"}`));

  const [[{ rowCount }]] = await pool.query("SELECT COUNT(*) AS rowCount FROM event_team_members");
  console.log(`\nTotal rows in event_team_members: ${rowCount}`);
  console.log("\n✅ Migration complete! Event team members will now work correctly.\n");

  await pool.end();
}

migrate().catch(e => {
  console.error("❌ Migration failed:", e.message);
  process.exit(1);
});
