const mysql = require('mysql2/promise');
async function check() {
  const pool = await mysql.createPool({ host:'localhost', user:'root', password:'MySql@123', database:'ekel_sport', port:3306 });

  // Find testuser2
  const [user] = await pool.query("SELECT id, full_name, student_id FROM users WHERE full_name = 'testuser2' OR student_id = 'testuser2' LIMIT 5");
  console.log('=== users matching testuser2 ===');
  user.forEach(u => console.log(JSON.stringify(u)));

  if (!user[0]) { await pool.end(); return; }
  const uid = user[0].id;

  // All performance entries
  const [perf] = await pool.query(
    'SELECT type, metric, value, sport_id FROM performance_entries WHERE student_user_id = ? ORDER BY type, value DESC',
    [uid]
  );
  console.log('\n=== performance_entries for id=' + uid + ' (' + perf.length + ' rows) ===');
  perf.forEach(p => console.log(JSON.stringify(p)));

  // Stats per type
  const [stats] = await pool.query(`
    SELECT type, COUNT(*) as cnt, ROUND(AVG(value),2) as avg, MAX(value) as best, MIN(value) as lowest
    FROM performance_entries WHERE student_user_id = ?
    GROUP BY type
  `, [uid]);
  console.log('\n=== aggregated by type ===');
  stats.forEach(s => console.log(JSON.stringify(s)));

  await pool.end();
}
check().catch(console.error);
