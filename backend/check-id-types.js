require('dotenv').config();
const { pool } = require('./src/db');
const fs = require('fs');

async function checkIdTypes() {
    try {
        const [usersCreate] = await pool.query('SHOW CREATE TABLE users');
        const output = [];
        output.push('=== USERS TABLE CREATE ===');
        output.push(usersCreate[0]['Create Table']);

        const [sportsCreate] = await pool.query('SHOW CREATE TABLE sports');
        output.push('\n=== SPORTS TABLE CREATE ===');
        output.push(sportsCreate[0]['Create Table']);

        fs.writeFileSync('table-structures.txt', output.join('\n'));
        console.log('✅ Table structures saved to table-structures.txt');

        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        await pool.end();
        process.exit(1);
    }
}

checkIdTypes();
