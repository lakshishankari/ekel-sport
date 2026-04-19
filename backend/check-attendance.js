const mysql = require('mysql2/promise');
async function check() {
  const pool = await mysql.createPool({ host:'localhost', user:'root', password:'MySql@123', database:'ekel_sport', port:3306 });

  const [sessions] = await pool.query('SELECT * FROM attendance_sessions ORDER BY created_at DESC');
  console.log('=== attendance_sessions (' + sessions.length + ' rows) ===');
  sessions.forEach(s => console.log(JSON.stringify(s)));

  const [att] = await pool.query('SELECT COUNT(*) as total FROM attendance');
  console.log('\n=== attendance rows:', att[0].total, '===');

  const [attRows] = await pool.query(`
    SELECT a.id, a.student_user_id, a.session_id, a.status, a.attended_at,
           u.full_name, sp.name as sport
    FROM attendance a
    JOIN users u ON u.id = a.student_user_id
    JOIN attendance_sessions ats ON ats.id = a.session_id
    JOIN sports sp ON sp.id = ats.sport_id
    ORDER BY a.attended_at DESC LIMIT 20
  `);
  attRows.forEach(r => console.log(JSON.stringify(r)));

  await pool.end();
}
check().catch(console.error);
