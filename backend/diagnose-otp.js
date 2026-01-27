const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkOTPs() {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'MySql@123',
        database: 'ekel_sport'
    });

    const [rows] = await conn.query('SELECT * FROM password_reset_otps ORDER BY id DESC LIMIT 10');

    console.log('\n======================================');
    console.log('PASSWORD RESET OTP DIAGNOSIS');
    console.log('======================================\n');
    console.log('ENV Setting: OTP_EXP_MINUTES =', process.env.OTP_EXP_MINUTES, 'minutes\n');

    rows.forEach(r => {
        const created = new Date(r.created_at);
        const expires = new Date(r.expires_at);
        const now = new Date();
        const durationMins = Math.round((expires - created) / 60000);
        const remainingSecs = Math.round((expires - now) / 1000);

        console.log(`OTP ID: ${r.id}`);
        console.log(`  User ID: ${r.user_id}`);
        console.log(`  Created: ${created.toLocaleString()}`);
        console.log(`  Expires: ${expires.toLocaleString()}`);
        console.log(`  ⏱️  Duration: ${durationMins} minutes`);
        console.log(`  ⏳ Remaining: ${remainingSecs} seconds (${remainingSecs > 0 ? 'VALID' : 'EXPIRED'})`);
        console.log(`  Used: ${r.used_at ? 'YES' : 'NO'}`);
        console.log(`  Attempts: ${r.attempts}`);
        console.log('');
    });

    await conn.end();
}

checkOTPs().catch(console.error);
