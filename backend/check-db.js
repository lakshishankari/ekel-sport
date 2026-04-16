require('dotenv').config();
const mysql = require('./node_modules/mysql2/promise');

async function run() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    const [rows] = await conn.query("SHOW TABLES LIKE 'otp_codes'");
    console.log('otp_codes table exists:', rows.length > 0);
    
    if (rows.length > 0) {
      const [cols] = await conn.query('DESCRIBE otp_codes');
      console.log('Columns:', cols.map(c => c.Field).join(', '));
    } else {
      console.log('TABLE MISSING — needs to be created!');
    }
    
    // Also list all tables
    const [tables] = await conn.query('SHOW TABLES');
    console.log('All tables:', tables.map(t => Object.values(t)[0]).join(', '));
    
    await conn.end();
  } catch (e) {
    console.log('DB_ERROR:', e.message);
  }
}

run();
