require("dotenv").config();
const { pool } = require("./src/db");

async function fix() {
  // Find the bad entry
  const [rows] = await pool.query(
    `SELECT pe.id, pe.value, pe.type, u.full_name, u.id AS user_id
     FROM performance_entries pe
     JOIN users u ON u.id = pe.student_user_id
     WHERE pe.value > 100
     ORDER BY pe.value DESC`
  );
  console.log("Out-of-range entries:", JSON.stringify(rows, null, 2));

  if (rows.length === 0) {
    console.log("No out-of-range entries found!");
    await pool.end();
    return;
  }

  // Fix all of them to 80
  const ids = rows.map(r => r.id);
  const [result] = await pool.query(
    `UPDATE performance_entries SET value = 80 WHERE id IN (?)`,
    [ids]
  );
  console.log("✅ Fixed rows:", result.affectedRows);
  await pool.end();
}
fix().catch(e => { console.error("❌", e.message); process.exit(1); });
