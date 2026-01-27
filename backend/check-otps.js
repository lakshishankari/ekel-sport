const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkOTPs() {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'MySql@123',
        database: 'ekel_sport'
    });

    const [rows] = await conn.query(`
    SELECT 
      id, 
      user_id,
      created_at, 
      expires_at,
      TIMESTAMPDIFF(MINUTE, created_at, expires_at) as duration_minutes,
      TIMESTAMPDIFF(SECOND, NOW(), expires_at) as seconds_remaining,
      used_at,
      attempts
    FROM password_reset_otps 
    ORDER BY id DESC 
    LIMIT 5
  `);

    console.log('\n=== Recent Password Reset OTPs ===\n');
    rows.forEach(r => {
        console.log(`ID: ${r.id}`);
        console.log(`  Created: ${r.created_at}`);
        console.log(`  Expires: ${r.expires_at}`);
        console.log(`  Duration: ${r.duration_minutes} minutes`);
        console.log(`  Remaining: ${r.seconds_remaining} seconds`);
        console.log(`  Used: ${r.used_at ? 'YES' : 'NO'}`);
        console.log(`  Attempts: ${r.attempts}`);
        console.log('');
    });

    console.log('OTP_EXP_MINUTES setting:', process.env.OTP_EXP_MINUTES);

    await conn.end();
}

checkOTPs().catch(console.error);
