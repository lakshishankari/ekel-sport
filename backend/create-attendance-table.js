require('dotenv').config();
const { pool } = require('./src/db');
const fs = require('fs');

async function createAttendanceTable() {
    try {
        const sql = fs.readFileSync('./database/init-attendance.sql', 'utf8');
        await pool.query(sql);
        console.log('✅ Attendance table created successfully!');

        const [rows] = await pool.query('DESCRIBE attendance');
        console.log('\n📊 Attendance table structure:');
        rows.forEach(r => {
            console.log(`  ${r.Field}: ${r.Type} ${r.Null} ${r.Key}`);
        });

        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
        process.exit(1);
    }
}

createAttendanceTable();
