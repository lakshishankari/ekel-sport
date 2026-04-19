require("dotenv").config();
const mysql = require("mysql2/promise");

async function main() {
  const pool = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     Number(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  // All tables
  const [tables] = await pool.query("SHOW TABLES");
  const key = Object.keys(tables[0])[0];
  const tableNames = tables.map(r => r[key]);
  console.log("\n=== ALL TABLES IN DATABASE ===");
  tableNames.forEach((t, i) => console.log(`  ${i+1}. ${t}`));

  // Row counts per table
  console.log("\n=== ROW COUNTS ===");
  for (const t of tableNames) {
    const [[{ cnt }]] = await pool.query(`SELECT COUNT(*) AS cnt FROM \`${t}\``);
    console.log(`  ${t.padEnd(36)} ${cnt} rows`);
  }

  await pool.end();
}
main().catch(console.error);
