require("dotenv").config();
const { pool } = require("./src/db");
const fs = require("fs");

const REQUIRED_TABLES = [
  "users",
  "sports",
  "sport_enrollments",
  "otp_codes",
  "password_reset_otps",
  "notifications",
  "attendance",
];

const REQUIRED_COLUMNS = {
  users: ["id","role","student_id","full_name","email","password_hash","created_at"],
  sports: ["id","name","venue","schedule_text","instructor_name","instructor_email","whatsapp_link","created_at"],
  sport_enrollments: ["id","sport_id","student_user_id","status","requested_at","decided_at","decided_by_admin_id","decision_note"],
  otp_codes: ["id","email","purpose","otp_hash","expires_at","attempts","used_at","created_at"],
  password_reset_otps: ["id","user_id","otp_hash","expires_at","attempts","used_at"],
  notifications: ["id","user_id","title","message","type","is_read","created_at"],
  attendance: ["id","student_user_id","sport_id","session_date"],
};

async function audit() {
  const lines = [];
  const log = (msg) => { lines.push(msg); };

  log("EKEL-SPORT DATABASE FULL AUDIT");
  log("=".repeat(60));
  log("");

  try {
    await pool.query("SELECT 1");
    log("DB CONNECTION: OK");
    log("");

    // List all tables
    const [tables] = await pool.query("SHOW TABLES");
    const tableNames = tables.map(t => Object.values(t)[0]);
    log("TABLES IN DATABASE:");
    tableNames.forEach(t => log("  - " + t));
    log("");

    // Check required tables
    log("REQUIRED TABLE CHECK:");
    const missing = [];
    for (const req of REQUIRED_TABLES) {
      if (tableNames.includes(req)) {
        log(`  [OK]      ${req}`);
      } else {
        log(`  [MISSING] ${req}  <-- NEEDS CREATING`);
        missing.push(req);
      }
    }
    log("");

    // Describe each table
    for (const table of REQUIRED_TABLES) {
      if (!tableNames.includes(table)) {
        log(`TABLE: ${table} -- DOES NOT EXIST`);
        log("");
        continue;
      }

      log(`TABLE: ${table}`);
      log("-".repeat(90));
      const [cols] = await pool.query(`DESCRIBE ${table}`);
      log(`  Field                        | Type                     | Null | Key   | Default`);
      log(`  ${"-".repeat(85)}`);
      for (const col of cols) {
        const key = col.Key === "PRI" ? "PK" : col.Key === "MUL" ? "FK/IDX" : col.Key === "UNI" ? "UNI" : "";
        const f = col.Field.padEnd(28);
        const t = col.Type.padEnd(24);
        const n = col.Null.padEnd(4);
        const k = key.padEnd(5);
        const d = col.Default ?? "NULL";
        log(`  ${f} | ${t} | ${n} | ${k} | ${d}`);
      }

      // Missing column check
      const existing = cols.map(c => c.Field);
      const reqCols = REQUIRED_COLUMNS[table] || [];
      const missingCols = reqCols.filter(f => !existing.includes(f));
      if (missingCols.length > 0) {
        log(`  ** MISSING COLUMNS: ${missingCols.join(", ")} **`);
      } else {
        log(`  >> All required columns present`);
      }
      log("");
    }

    // Foreign keys
    log("FOREIGN KEY CONSTRAINTS:");
    log("-".repeat(60));
    const [fks] = await pool.query(`
      SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME,
             REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE REFERENCED_TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `);
    if (fks.length === 0) {
      log("  WARNING: No foreign keys found! Tables are not linked.");
    } else {
      for (const fk of fks) {
        log(`  ${fk.TABLE_NAME}.${fk.COLUMN_NAME} => ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}  [${fk.CONSTRAINT_NAME}]`);
      }
    }
    log("");

    // Row counts
    log("ROW COUNTS:");
    log("-".repeat(40));
    for (const table of tableNames) {
      const [[count]] = await pool.query(`SELECT COUNT(*) AS cnt FROM ${table}`);
      const cnt = count.cnt;
      const warn = cnt === 0 ? "  (empty)" : "";
      log(`  ${table.padEnd(32)} ${String(cnt).padStart(5)} rows${warn}`);
    }
    log("");

    // Summary
    log("=".repeat(60));
    log("SUMMARY");
    log("=".repeat(60));
    if (missing.length === 0) {
      log("ALL REQUIRED TABLES EXIST");
    } else {
      log(`MISSING TABLES (${missing.length}): ${missing.join(", ")}`);
    }
    log("Audit complete.");

    const output = lines.join("\n");
    fs.writeFileSync("audit-result.txt", output, "utf8");
    console.log(output);
    await pool.end();
  } catch (err) {
    const errMsg = "AUDIT FAILED: " + err.message;
    lines.push(errMsg);
    fs.writeFileSync("audit-result.txt", lines.join("\n"), "utf8");
    console.error(errMsg);
    await pool.end();
    process.exit(1);
  }
}

audit();
