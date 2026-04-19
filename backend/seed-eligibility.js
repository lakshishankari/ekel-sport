/**
 * seed-eligibility.js
 * Run with: node seed-eligibility.js
 * Seeds eligibility_criteria for all sports in the database.
 */
require("dotenv").config();
const mysql = require("mysql2/promise");

const ELIGIBILITY_MAP = {
  Cricket: `Age 17–35 years
Medical fitness certificate required
Must be enrolled or applying to the university
Prior cricket experience preferred (not mandatory)
Availability for weekend matches and tournaments`,

  Badminton: `Age 16–35 years
Medical fitness certificate required
Open to all genders
No prior experience required — beginners welcome
Must attend at least 2 training sessions per week`,

  Football: `Age 17–30 years
Medical fitness certificate required
Basic football skills required
Must commit to team training sessions (Mon/Wed/Fri)
Valid student or enrollment ID required`,

  Basketball: `Age 17–32 years
Medical fitness certificate
Open to all fitness levels
Height and physical fitness test may be conducted
Prior basketball experience is an advantage`,

  Volleyball: `Age 17–30 years
Medical fitness certificate required
Open to both male and female players
Team-oriented attitude required
At least 1 year of volleyball experience preferred`,

  Athletics: `Age 16–35 years
Medical fitness certificate
Open to all nationalities including international students
Select your event: sprint, long distance, throwing, or jumping
No prior competitive experience required`,

  Swimming: `Age 15–35 years
Must be a competent swimmer (basic level minimum)
Medical fitness certificate required
Swim cap and competition swimwear required
Pool safety guidelines must be followed`,

  Karate: `Age 14–35 years
Medical fitness certificate
No prior martial arts experience required
Full discipline and respect for dojo etiquette
White uniform (gi) required from week 2 onwards`,

  Tennis: `Age 16–35 years
Medical fitness certificate
Racket and proper court shoes required
Open to beginners and intermediate players
Minimum 2-day training attendance per week`,

  Hockey: `Age 17–30 years
Medical fitness certificate
Shin guards and mouth guard mandatory
Prior sport experience a plus
Commitment to full season required`,

  Rugby: `Age 18–32 years
Medical fitness certificate required
Full contact — participants must sign a liability waiver
Prior rugby or contact sport experience preferred
Insurance coverage must be verified`,

  Chess: `Age 14 and above
No physical fitness requirements
Open to all
Basic knowledge of chess rules required
Must participate in at least 2 scheduled club sessions per month`,
};

async function seed() {
  const pool = await mysql.createPool({
    host:     process.env.DB_HOST     || "localhost",
    port:     Number(process.env.DB_PORT || 3306),
    user:     process.env.DB_USER     || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME     || "ekel_sport",
  });

  try {
    // Ensure column exists
    try {
      await pool.query(`ALTER TABLE sports ADD COLUMN eligibility_criteria TEXT NULL AFTER whatsapp_link`);
      console.log("✅ Added eligibility_criteria column");
    } catch (_) {
      console.log("ℹ️  eligibility_criteria column already exists");
    }

    // Fetch all sports
    const [sports] = await pool.query("SELECT id, name FROM sports");
    console.log(`\nFound ${sports.length} sport(s) in database:\n`);

    let updated = 0;
    for (const sport of sports) {
      const criteria = ELIGIBILITY_MAP[sport.name];
      if (criteria) {
        await pool.query(
          "UPDATE sports SET eligibility_criteria = ? WHERE id = ?",
          [criteria.trim(), sport.id]
        );
        console.log(`  ✅ Set eligibility for: ${sport.name}`);
        updated++;
      } else {
        // Generic fallback for sports not in the map
        const generic = `Age 16–35 years\nMedical fitness certificate required\nOpen to all nationalities\nValid student or enrollment ID required`;
        await pool.query(
          "UPDATE sports SET eligibility_criteria = ? WHERE id = ?",
          [generic, sport.id]
        );
        console.log(`  ℹ️  Set generic eligibility for: ${sport.name}`);
        updated++;
      }
    }

    console.log(`\n🎉 Done! Updated eligibility_criteria for ${updated} sport(s).`);
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await pool.end();
  }
}

seed();
