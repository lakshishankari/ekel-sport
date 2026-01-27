const axios = require('axios');

async function testFullFlow() {
    try {
        // Step 1: Request OTP
        console.log('1. Requesting OTP...');
        const forgotRes = await axios.post('http://localhost:5000/auth/forgot-password', {
            email: 'diwanja-im22051@stu.kln.ac.lk'
        });
        console.log('   Response:', forgotRes.data);

        // Check database
        const mysql = require('mysql2/promise');
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'MySql@123',
            database: 'ekel_sport'
        });

        const [rows] = await conn.query(`
      SELECT created_at, expires_at, 
             NOW() as current_time,
             TIMESTAMPDIFF(SECOND, NOW(), expires_at) as seconds_until_expiry
      FROM password_reset_otps 
      ORDER BY id DESC LIMIT 1
    `);

        console.log('\n2. Latest OTP in database:');
        console.log('   Created:', rows[0].created_at);
        console.log('   Expires:', rows[0].expires_at);
        console.log('   Current Time:', rows[0].current_time);
        console.log('   Seconds until expiry:', rows[0].seconds_until_expiry);
        console.log('   Status:', rows[0].seconds_until_expiry > 0 ? '✅ VALID' : '❌ EXPIRED');

        await conn.end();

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testFullFlow();
