require('dotenv').config();
const { pool } = require('./src/db');

async function checkTables() {
    try {
        console.log('=== USERS TABLE ===');
        const [userCols] = await pool.query('DESCRIBE users');
        userCols.forEach(col => {
            console.log(`${col.Field}: ${col.Type}`);
        });

        console.log('\n=== SPORTS TABLE ===');
        const [sportCols] = await pool.query('DESCRIBE sports');
        sportCols.forEach(col => {
            console.log(`${col.Field}: ${col.Type}`);
        });

        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        await pool.end();
        process.exit(1);
    }
}

checkTables();
