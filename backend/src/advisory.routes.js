const express = require("express");
const { pool } = require("./db");
const { authMiddleware } = require("./middleware/auth.middleware");
const { roleMiddleware } = require("./middleware/role.middleware");

const advisoryRouter = express.Router();

// ─── Middleware shorthand ────────────────────────────────────────────────────
const guard = [authMiddleware, roleMiddleware(["ADVISORY"])];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/advisory/kpi
// Returns real dashboard stats for the advisory board
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
advisoryRouter.get("/kpi", ...guard, async (req, res) => {
  try {
    // Total distinct APPROVED enrolled students
    const [[{ totalEnrolled }]] = await pool.query(`
      SELECT COUNT(DISTINCT student_user_id) AS totalEnrolled
      FROM sport_enrollments WHERE status = 'APPROVED'
    `);

    // Total sports in system
    const [[{ totalSports }]] = await pool.query(`
      SELECT COUNT(*) AS totalSports FROM sports
    `);

    // Students in SQUAD level
    const [[{ inSquad }]] = await pool.query(`
      SELECT COUNT(DISTINCT student_user_id) AS inSquad
      FROM sport_enrollments WHERE status = 'APPROVED' AND squad_level = 'SQUAD'
    `);

    // Students in POOL level
    const [[{ inPool }]] = await pool.query(`
      SELECT COUNT(DISTINCT student_user_id) AS inPool
      FROM sport_enrollments WHERE status = 'APPROVED' AND squad_level = 'POOL'
    `);

    // Total sessions held across all sports
    const [[{ totalSessions }]] = await pool.query(`
      SELECT COUNT(*) AS totalSessions FROM attendance_sessions
    `);

    // Pending enrollment requests
    const [[{ pendingEnrollments }]] = await pool.query(`
      SELECT COUNT(*) AS pendingEnrollments
      FROM sport_enrollments WHERE status = 'PENDING'
    `);

    return res.json({
      totalEnrolled:     Number(totalEnrolled),
      totalSports:       Number(totalSports),
      inSquad:           Number(inSquad),
      inPool:            Number(inPool),
      totalSessions:     Number(totalSessions),
      pendingEnrollments: Number(pendingEnrollments),
    });
  } catch (err) {
    console.error("ADVISORY KPI ERROR:", err);
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

    // Total sessions for this sport (for attendance % calculation)
    const [[{ totalSessions }]] = await pool.query(
      "SELECT COUNT(*) AS totalSessions FROM attendance_sessions WHERE sport_id = ?",
      [sportId]
    );

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
          SELECT COUNT(a2.id)
          FROM attendance a2
          WHERE a2.student_user_id = u.id AND a2.sport_id = ? AND a2.status = 'PRESENT'
        ) AS sessionsAttended
      FROM sport_enrollments se
      JOIN users u ON u.id = se.student_user_id
      LEFT JOIN performance_entries pe
        ON pe.student_user_id = u.id AND pe.sport_id = ?
      WHERE se.sport_id = ? AND se.status = 'APPROVED'
      GROUP BY u.id, u.full_name, u.student_id, se.squad_level
      ORDER BY se.squad_level DESC, u.full_name ASC
      `,
      [sportId, sportId, sportId]
    );

    const sessTotal = Number(totalSessions) || 0;

    const students = rows.map((r) => {
      const match    = r.matchScore   != null ? Number(r.matchScore)   : null;
      const fitness  = r.fitnessScore != null ? Number(r.fitnessScore) : null;
      const disc     = r.discipline   != null ? Number(r.discipline)   : null;
      const sessAtt  = Number(r.sessionsAttended ?? 0);
      const attend   = sessTotal > 0 ? Math.round((sessAtt / sessTotal) * 100) : null;

      // Use actual saved values for calculation; fall back to 50 only for the weighted score
      const mW = match   ?? 50;
      const fW = fitness ?? 50;
      const aW = attend  ?? 50;
      const dW = disc    ?? 50;
      const overall = Math.round(mW * 0.4 + fW * 0.25 + aW * 0.2 + dW * 0.15);
      const threshold = 60;

      let status = "NOT_ELIGIBLE";
      if (r.squadLevel === "SQUAD")         status = "ELIGIBLE";
      else if (r.squadLevel === "POOL")     status = "BORDERLINE";
      else if (overall >= threshold)        status = "ELIGIBLE";
      else if (overall >= threshold - 10)   status = "BORDERLINE";

      return {
        id:               String(r.id),
        name:             r.name,
        studentId:        r.studentId ?? "—",
        sport:            String(sportId),
        matchScore:       match,
        fitnessScore:     fitness,
        attendance:       attend,
        discipline:       disc,
        sessionsAttended: sessAtt,
        totalSessions:    sessTotal,
        overallScore:     overall,
        threshold,
        status,
        squadLevel:       r.squadLevel ?? "NONE",
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
      return res.json({
        sportId,
        match: 40, fitness: 25, attendance: 20, discipline: 15, threshold: 60,
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
      `INSERT INTO advisory_weightages
        (sport_id, match_weight, fitness_weight, attendance_weight, discipline_weight, threshold, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        match_weight      = VALUES(match_weight),
        fitness_weight    = VALUES(fitness_weight),
        attendance_weight = VALUES(attendance_weight),
        discipline_weight = VALUES(discipline_weight),
        threshold         = VALUES(threshold),
        updated_by        = VALUES(updated_by)`,
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
