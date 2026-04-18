require("dotenv").config();
const { pool } = require("./src/db");

(async () => {
  // Simulate what the API does for user: ashan.p@student.kln.ac.lk (id from DB)
  const [userRows] = await pool.query("SELECT id FROM users WHERE email = ?", ["ashan.p@student.kln.ac.lk"]);
  if (!userRows[0]) { console.log("User not found!"); process.exit(1); }
  const userId = userRows[0].id;
  console.log("Testing for user id:", userId);

  // 1. Check enrollments
  const [enrollments] = await pool.query(
    "SELECT s.name, se.status, se.squad_level FROM sport_enrollments se JOIN sports s ON s.id = se.sport_id WHERE se.student_user_id = ? AND se.status = 'APPROVED'",
    [userId]
  );
  console.log("\nApproved enrollments:", JSON.stringify(enrollments, null, 2));

  // 2. Check performance entries
  const [perf] = await pool.query(
    "SELECT pe.sport_id, pe.type, pe.value FROM performance_entries pe WHERE pe.student_user_id = ? LIMIT 10",
    [userId]
  );
  console.log("\nPerformance entries:", JSON.stringify(perf, null, 2));

  // 3. Run the actual performance API query
  const [rows] = await pool.query(`
    SELECT
      s.id   AS sport_id,
      s.name AS sport_name,
      pe.type,
      ROUND(AVG(pe.value), 1) AS avg_score,
      COUNT(pe.id)            AS entry_count,
      MAX(pe.value)           AS best_score,
      MIN(pe.value)           AS lowest_score
    FROM sport_enrollments se
    JOIN sports s ON s.id = se.sport_id
    JOIN performance_entries pe ON pe.student_user_id = ? AND pe.sport_id = s.id
    WHERE se.student_user_id = ? AND se.status = 'APPROVED'
    GROUP BY s.id, s.name, pe.type
    ORDER BY s.name ASC, pe.type ASC
  `, [userId, userId]);

  console.log("\nAPI query result:", JSON.stringify(rows, null, 2));
  await pool.end();
})().catch(e => { console.error(e.message); process.exit(1); });
