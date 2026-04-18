require("dotenv").config();
const { pool } = require("./src/db");
(async () => {
  const tables = ["announcements", "posts", "notifications", "student_team_assignment", "event_team_members"];
  for (const t of tables) {
    try {
      const [cols] = await pool.query(`SHOW COLUMNS FROM \`${t}\``);
      console.log(`\n${t}: ${cols.map(c => c.Field).join(", ")}`);
    } catch(e) { console.log(`\n${t}: ERROR - ${e.message}`); }
  }
  await pool.end();
})().catch(e => { console.error(e.message); process.exit(1); });
