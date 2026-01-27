require("dotenv").config();
const { pool } = require("./src/db");
const fs = require("fs");

async function checkSchema() {
    const output = [];
    const log = (msg) => {
        console.log(msg);
        output.push(msg);
    };

    try {
        log("🔍 Checking database schema...\n");

        // Check tables
        const [tables] = await pool.query("SHOW TABLES");
        log("📋 Available tables:");
        tables.forEach(t => log("  - " + Object.values(t)[0]));

        // Check otp_codes structure
        log("\n📊 Checking otp_codes table...");
        try {
            const [otpCols] = await pool.query("DESCRIBE otp_codes");
            log("✅ otp_codes table exists:");
            otpCols.forEach(c => log(`  - ${c.Field} (${c.Type}) ${c.Null} ${c.Key} ${c.Default || ''}`));
        } catch (e) {
            log("❌ otp_codes table does NOT exist - will create it");
        }

        // Check password_reset_otps structure
        log("\n📊 Checking password_reset_otps table...");
        try {
            const [resetCols] = await pool.query("DESCRIBE password_reset_otps");
            log("✅ password_reset_otps table exists:");
            resetCols.forEach(c => log(`  - ${c.Field} (${c.Type}) ${c.Null} ${c.Key} ${c.Default || ''}`));
        } catch (e) {
            log("❌ password_reset_otps table does NOT exist - will create it");
        }

        // Check users table password field
        log("\n📊 Checking users table password field...");
        const [usersCols] = await pool.query("DESCRIBE users");
        const pwField = usersCols.find(c => c.Field.toLowerCase().includes('password'));
        if (pwField) {
            log(`✅ Password field: ${pwField.Field} (${pwField.Type})`);
        } else {
            log("❌ No password field found in users table!");
        }

        await pool.end();
        log("\n✅ Schema check complete!");

        fs.writeFileSync("schema-check-result.txt", output.join("\n"));
        log("\n💾 Results saved to schema-check-result.txt");
    } catch (error) {
        log("❌ Error: " + error.message);
        fs.writeFileSync("schema-check-result.txt", output.join("\n") + "\n\nERROR: " + error.stack);
        process.exit(1);
    }
}

checkSchema();
