const express = require("express");
const { pool } = require("./db");
const { authMiddleware } = require("./middleware/auth.middleware");
const { roleMiddleware } = require("./middleware/role.middleware");

const advisoryRouter = express.Router();

// ─── Middleware shorthand ────────────────────────────────────────────────────
const guard = [authMiddleware, roleMiddleware(["ADVISORY"])];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/advisory/kpi
// Returns overall eligibility KPI counts across all sports
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
advisoryRouter.get("/kpi", ...guard, async (req, res) => {
  try {
    // Count total distinct APPROVED students across all sports
    const [totalRows] = await pool.query(`
      SELECT COUNT(DISTINCT student_user_id) AS total
      FROM sport_enrollments
      WHERE status = 'APPROVED'
    `);

    // Count by eligibility status (uses colors_eligibility if exists, else squad_level)
    const [byStatus] = await pool.query(`
      SELECT
        SUM(CASE WHEN squad_level = 'SQUAD' THEN 1 ELSE 0 END) AS eligible,
        SUM(CASE WHEN squad_level = 'POOL'  THEN 1 ELSE 0 END) AS borderline,
        SUM(CASE WHEN squad_level = 'NONE'  THEN 1 ELSE 0 END) AS not_eligible
      FROM sport_enrollments
      WHERE status = 'APPROVED'
    `);

    const total       = Number(totalRows[0]?.total ?? 0);
    const eligible    = Number(byStatus[0]?.eligible ?? 0);
    const borderline  = Number(byStatus[0]?.borderline ?? 0);
    const notEligible = Number(byStatus[0]?.not_eligible ?? 0);

    return res.json({ total, eligible, borderline, notEligible });
  } catch (err) {
    console.error("ADVISORY KPI ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/advisory/sports-summary
// Returns per-sport eligible/total counts for the home dashboard
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
advisoryRouter.get("/sports-summary", ...guard, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        s.id,
        s.name AS sport,
        COUNT(se.id)                                             AS total,
        SUM(CASE WHEN se.squad_level IN ('POOL','SQUAD') THEN 1 ELSE 0 END) AS eligible
      FROM sports s
      LEFT JOIN sport_enrollments se
        ON se.sport_id = s.id AND se.status = 'APPROVED'
      GROUP BY s.id, s.name
      ORDER BY s.name ASC
    `);

    const result = rows.map((r) => ({
      sport:    r.sport,
      total:    Number(r.total),
      eligible: Number(r.eligible),
      pct:      r.total > 0 ? Math.round((Number(r.eligible) / Number(r.total)) * 100) : 0,
    }));

    return res.json(result);
  } catch (err) {
    console.error("ADVISORY SPORTS SUMMARY ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/advisory/eligibility?sportId=<id>
// Returns students for a given sport with aggregated scores
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
advisoryRouter.get("/eligibility", ...guard, async (req, res) => {
  try {
    const sportId = Number(req.query.sportId);
    if (!sportId) {
      return res.status(400).json({ message: "sportId query param is required" });
    }

    const [rows] = await pool.query(
      `
      SELECT
        u.id                                                          AS id,
        u.full_name                                                   AS name,
        u.student_id                                                  AS studentId,
        se.squad_level                                                AS squadLevel,
        ROUND(AVG(CASE WHEN pe.type = 'MATCH'      THEN pe.value END), 1) AS matchScore,
        ROUND(AVG(CASE WHEN pe.type = 'FITNESS'    THEN pe.value END), 1) AS fitnessScore,
        ROUND(AVG(CASE WHEN pe.type = 'DISCIPLINE' THEN pe.value END), 1) AS discipline,
        (
          SELECT ROUND(
            (COUNT(a2.id) * 100.0) /
            NULLIF((SELECT COUNT(*) FROM attendance_sessions WHERE sport_id = ?), 0)
          , 1)
          FROM attendance a2
          WHERE a2.student_user_id = u.id AND a2.sport_id = ?
        ) AS attendance
      FROM sport_enrollments se
      JOIN users u ON u.id = se.student_user_id
      LEFT JOIN performance_entries pe
        ON pe.student_user_id = u.id AND pe.sport_id = ?
      WHERE se.sport_id = ? AND se.status = 'APPROVED'
      GROUP BY u.id, u.full_name, u.student_id, se.squad_level
      ORDER BY se.squad_level DESC, u.full_name ASC
      `,
      [sportId, sportId, sportId, sportId]
    );

    // Derive status from squad_level
    const students = rows.map((r) => {
      const match    = Number(r.matchScore    ?? 50);
      const fitness  = Number(r.fitnessScore  ?? 50);
      const attend   = Number(r.attendance    ?? 50);
      const disc     = Number(r.discipline    ?? 50);
      // Default weights: match 40, fitness 25, attendance 20, discipline 15
      const overall  = Math.round(match * 0.4 + fitness * 0.25 + attend * 0.2 + disc * 0.15);
      const threshold = 60;

      let status = "NOT_ELIGIBLE";
      if (r.squadLevel === "SQUAD") status = "ELIGIBLE";
      else if (r.squadLevel === "POOL") status  = "BORDERLINE";
      else if (overall >= threshold)    status  = "ELIGIBLE";
      else if (overall >= threshold - 10) status = "BORDERLINE";

      return {
        id:           String(r.id),
        name:         r.name,
        studentId:    r.studentId ?? "—",
        department:   "—",          // Not stored in DB yet
        sport:        String(sportId),
        matchScore:   match,
        fitnessScore: fitness,
        attendance:   attend,
        discipline:   disc,
        overallScore: overall,
        threshold,
        status,
        squadLevel: r.squadLevel ?? "NONE",
      };
    });

    return res.json(students);
  } catch (err) {
    console.error("ADVISORY ELIGIBILITY ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/advisory/weightages/:sportId
// Returns saved weightages config for a sport (or defaults)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
advisoryRouter.get("/weightages/:sportId", ...guard, async (req, res) => {
  try {
    const sportId = Number(req.params.sportId);
    if (!sportId) return res.status(400).json({ message: "Invalid sportId" });

    const [rows] = await pool.query(
      "SELECT * FROM advisory_weightages WHERE sport_id = ? LIMIT 1",
      [sportId]
    );

    if (rows.length === 0) {
      // Return defaults
      return res.json({
        sportId,
        match:      40,
        fitness:    25,
        attendance: 20,
        discipline: 15,
        threshold:  60,
      });
    }

    const w = rows[0];
    return res.json({
      sportId,
      match:      w.match_weight,
      fitness:    w.fitness_weight,
      attendance: w.attendance_weight,
      discipline: w.discipline_weight,
      threshold:  w.threshold,
    });
  } catch (err) {
    // Table may not exist yet — return defaults gracefully
    console.warn("ADVISORY WEIGHTAGES GET (table may not exist):", err.message);
    return res.json({
      sportId: Number(req.params.sportId),
      match: 40, fitness: 25, attendance: 20, discipline: 15, threshold: 60,
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/advisory/weightages/:sportId
// Upsert weightages for a sport
// Body: { match, fitness, attendance, discipline, threshold }
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
advisoryRouter.post("/weightages/:sportId", ...guard, async (req, res) => {
  try {
    const sportId    = Number(req.params.sportId);
    const match      = Number(req.body?.match      ?? 40);
    const fitness    = Number(req.body?.fitness    ?? 25);
    const attendance = Number(req.body?.attendance ?? 20);
    const discipline = Number(req.body?.discipline ?? 15);
    const threshold  = Number(req.body?.threshold  ?? 60);

    if (!sportId) return res.status(400).json({ message: "Invalid sportId" });

    const total = match + fitness + attendance + discipline;
    if (total !== 100) {
      return res.status(400).json({ message: `Weights must sum to 100 (got ${total})` });
    }

    // Ensure table exists (create on first use)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS advisory_weightages (
        id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        sport_id        INT UNSIGNED NOT NULL UNIQUE,
        match_weight    TINYINT UNSIGNED NOT NULL DEFAULT 40,
        fitness_weight  TINYINT UNSIGNED NOT NULL DEFAULT 25,
        attendance_weight TINYINT UNSIGNED NOT NULL DEFAULT 20,
        discipline_weight TINYINT UNSIGNED NOT NULL DEFAULT 15,
        threshold       TINYINT UNSIGNED NOT NULL DEFAULT 60,
        updated_by      BIGINT UNSIGNED,
        updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await pool.query(
      `
      INSERT INTO advisory_weightages
        (sport_id, match_weight, fitness_weight, attendance_weight, discipline_weight, threshold, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        match_weight      = VALUES(match_weight),
        fitness_weight    = VALUES(fitness_weight),
        attendance_weight = VALUES(attendance_weight),
        discipline_weight = VALUES(discipline_weight),
        threshold         = VALUES(threshold),
        updated_by        = VALUES(updated_by)
      `,
      [sportId, match, fitness, attendance, discipline, threshold, req.user.id]
    );

    return res.json({ ok: true, message: "Weightages saved" });
  } catch (err) {
    console.error("ADVISORY WEIGHTAGES SAVE ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/advisory/sports
// Returns all sports (for advisory to choose from)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
advisoryRouter.get("/sports", ...guard, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name FROM sports ORDER BY name ASC"
    );
    return res.json(rows);
  } catch (err) {
    console.error("ADVISORY SPORTS LIST ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = { advisoryRouter };
