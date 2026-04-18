require("dotenv").config();
const { pool } = require("./src/db");
const bcrypt = require("bcrypt");

// ─── Helpers ──────────────────────────────────────────────────
const hash = (pw) => bcrypt.hash(pw, 10);
const log  = (msg) => console.log("  " + msg);

// ─── Main seed ────────────────────────────────────────────────
async function seed() {
  console.log("\n=========================================");
  console.log("  EKEL-SPORT  ✦  Database Seed Script");
  console.log("=========================================\n");

  // ── 0. Ensure all optional tables exist ───────────────────────
  log("0. Ensuring tables exist...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance_sessions (
      id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      sport_id   INT UNSIGNED NOT NULL,
      session_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS student_team_assignment (
      id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      sport_id             INT UNSIGNED NOT NULL,
      student_user_id      BIGINT UNSIGNED NOT NULL,
      assigned_by_admin_id BIGINT UNSIGNED,
      level                ENUM('POOL','SQUAD') DEFAULT 'SQUAD',
      assigned_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_sport_student (sport_id, student_user_id)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      author_id   BIGINT UNSIGNED NOT NULL,
      author_name VARCHAR(255) NOT NULL,
      author_role ENUM('ADMIN','STUDENT') NOT NULL,
      sport_tag   VARCHAR(100),
      content     TEXT NOT NULL,
      likes_count INT UNSIGNED DEFAULT 0,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS announcements (
      id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      admin_id   BIGINT UNSIGNED NOT NULL,
      admin_name VARCHAR(255) NOT NULL,
      title      VARCHAR(255) NOT NULL,
      message    TEXT NOT NULL,
      sport_tag  VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      admin_id     BIGINT UNSIGNED NOT NULL,
      title        VARCHAR(255) NOT NULL,
      description  TEXT,
      sport_tag    VARCHAR(100),
      sport_id     INT UNSIGNED NULL,
      venue        VARCHAR(255),
      event_date   DATE,
      event_time   VARCHAR(50),
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_team_members (
      id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      event_id         INT UNSIGNED NOT NULL,
      student_user_id  BIGINT UNSIGNED NOT NULL,
      sport_id         INT UNSIGNED NOT NULL,
      assigned_by      BIGINT UNSIGNED,
      assigned_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_event_student (event_id, student_user_id)
    )
  `);
  // Make event_division_id nullable so fitness/discipline entries don't need a division
  try {
    await pool.query(`ALTER TABLE performance_entries MODIFY event_division_id INT UNSIGNED NULL DEFAULT NULL`);
    log("  ✓ performance_entries.event_division_id is now nullable");
  } catch(e) { log("  ↩ ALTER skipped: " + e.message); }

  // Fix event_divisions FK — it wrongly points to events_old instead of events
  try {
    await pool.query(`ALTER TABLE event_divisions DROP FOREIGN KEY event_divisions_ibfk_1`);
    log("  ✓ Dropped broken FK event_divisions_ibfk_1");
  } catch(e) { log("  ↩ Drop FK skipped: " + e.message); }
  try {
    await pool.query(`ALTER TABLE event_divisions ADD CONSTRAINT fk_ed_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE ON UPDATE CASCADE`);
    log("  ✓ Re-created FK event_divisions → events");
  } catch(e) { log("  ↩ Add FK skipped: " + e.message); }
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id       BIGINT UNSIGNED PRIMARY KEY,
      department    VARCHAR(255),
      year_of_study VARCHAR(100),
      bio           TEXT,
      avatar_color  VARCHAR(20) DEFAULT '#4F46E5',
      updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  log("  ✓ All tables ensured.\n");

  // ── 1. SPORTS ─────────────────────────────────────────────────
  log("1. Seeding sports...");
  const sportsData = [
    { name: "Cricket",    venue: "KLN Main Oval",        schedule: "Mon/Wed/Fri  6:00 AM – 8:00 AM",  instructor: "Chaminda Perera",  email: "c.perera@kln.ac.lk",   wa: "https://wa.me/94771234001" },
    { name: "Football",   venue: "Sports Ground A",      schedule: "Tue/Thu  5:30 AM – 7:30 AM",      instructor: "Nimal Rajapaksa", email: "n.rajapaksa@kln.ac.lk", wa: "https://wa.me/94771234002" },
    { name: "Swimming",   venue: "University Pool",      schedule: "Daily  7:00 AM – 8:30 AM",        instructor: "Dilani Silva",    email: "d.silva@kln.ac.lk",     wa: "https://wa.me/94771234003" },
    { name: "Badminton",  venue: "Indoor Sports Hall",   schedule: "Mon/Wed/Sat  4:00 PM – 6:00 PM",  instructor: "Ruwan Fernando", email: "r.fernando@kln.ac.lk",  wa: "https://wa.me/94771234004" },
    { name: "Athletics",  venue: "University Track",     schedule: "Mon–Fri  5:30 AM – 7:00 AM",      instructor: "Sanjeewa Udaya",  email: "s.udaya@kln.ac.lk",     wa: "https://wa.me/94771234005" },
    { name: "Volleyball", venue: "Outdoor Courts",       schedule: "Tue/Thu/Sat  4:30 PM – 6:30 PM",  instructor: "Kumari Nelum",   email: "k.nelum@kln.ac.lk",     wa: "https://wa.me/94771234006" },
    { name: "Basketball", venue: "Indoor Sports Hall B", schedule: "Mon/Wed/Fri  4:00 PM – 6:00 PM",  instructor: "Pradeep Mendis",  email: "p.mendis@kln.ac.lk",    wa: "https://wa.me/94771234007" },
    { name: "Table Tennis",venue: "Recreation Centre",  schedule: "Sat/Sun  2:00 PM – 5:00 PM",      instructor: "Lasith Gamage",  email: "l.gamage@kln.ac.lk",    wa: "https://wa.me/94771234008" },
  ];

  const sportIds = {};
  for (const s of sportsData) {
    const [existing] = await pool.query("SELECT id FROM sports WHERE name = ?", [s.name]);
    if (existing.length > 0) {
      sportIds[s.name] = existing[0].id;
      log(`  ↩ Sport already exists: ${s.name} (id=${existing[0].id})`);
    } else {
      const [r] = await pool.query(
        `INSERT INTO sports (name, venue, schedule_text, instructor_name, instructor_email, whatsapp_link)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [s.name, s.venue, s.schedule, s.instructor, s.email, s.wa]
      );
      sportIds[s.name] = r.insertId;
      log(`  ✓ Created sport: ${s.name} (id=${r.insertId})`);
    }
  }

  // ── 2. USERS ──────────────────────────────────────────────────
  log("\n2. Seeding users...");

  const usersData = [
    // ADMIN
    { role: "ADMIN",    student_id: null,        full_name: "Admin Pathum",         email: "admin@kln.ac.lk",         password: "Admin@123" },
    // ADVISORY
    { role: "ADVISORY", student_id: null,        full_name: "Dr. N. Wickramasinghe",email: "n.wickramasinghe@kln.ac.lk", password: "Advisory@123" },
    { role: "ADVISORY", student_id: null,        full_name: "Prof. S. Karunaratne",  email: "s.karunaratne@kln.ac.lk",    password: "Advisory@123" },
    // STUDENTS
    { role: "STUDENT",  student_id: "19000001", full_name: "Ashan Perera",         email: "ashan.p@student.kln.ac.lk",    password: "Student@123" },
    { role: "STUDENT",  student_id: "19000002", full_name: "Bimali Fernando",      email: "bimali.f@student.kln.ac.lk",   password: "Student@123" },
    { role: "STUDENT",  student_id: "20000003", full_name: "Chathura Silva",       email: "chathura.s@student.kln.ac.lk", password: "Student@123" },
    { role: "STUDENT",  student_id: "20000004", full_name: "Dilini Jayawardena",   email: "dilini.j@student.kln.ac.lk",   password: "Student@123" },
    { role: "STUDENT",  student_id: "21000005", full_name: "Eshan Rajapaksa",      email: "eshan.r@student.kln.ac.lk",    password: "Student@123" },
    { role: "STUDENT",  student_id: "21000006", full_name: "Fathima Nusra",        email: "fathima.n@student.kln.ac.lk",  password: "Student@123" },
    { role: "STUDENT",  student_id: "22000007", full_name: "Gimhan Bandara",       email: "gimhan.b@student.kln.ac.lk",   password: "Student@123" },
    { role: "STUDENT",  student_id: "22000008", full_name: "Hiruni Madushika",     email: "hiruni.m@student.kln.ac.lk",   password: "Student@123" },
    { role: "STUDENT",  student_id: "22000009", full_name: "Isuru Gunasekara",     email: "isuru.g@student.kln.ac.lk",    password: "Student@123" },
    { role: "STUDENT",  student_id: "23000010", full_name: "Janani Kumari",        email: "janani.k@student.kln.ac.lk",   password: "Student@123" },
    { role: "STUDENT",  student_id: "23000011", full_name: "Kasun Tharaka",        email: "kasun.t@student.kln.ac.lk",    password: "Student@123" },
    { role: "STUDENT",  student_id: "23000012", full_name: "Lakmali Dissanayake",  email: "lakmali.d@student.kln.ac.lk",  password: "Student@123" },
  ];

  const userIds = {};
  for (const u of usersData) {
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [u.email]);
    if (existing.length > 0) {
      userIds[u.email] = existing[0].id;
      log(`  ↩ User already exists: ${u.full_name}`);
    } else {
      const pw = await hash(u.password);
      const [r] = await pool.query(
        `INSERT INTO users (role, student_id, full_name, email, password_hash) VALUES (?, ?, ?, ?, ?)`,
        [u.role, u.student_id, u.full_name, u.email, pw]
      );
      userIds[u.email] = r.insertId;
      log(`  ✓ Created ${u.role}: ${u.full_name} (id=${r.insertId})`);
    }
  }

  // ── 3. STUDENT PROFILES ──────────────────────────────────────
  log("\n3. Seeding student profiles...");
  const profileData = [
    { email: "ashan.p@student.kln.ac.lk",    faculty: "Faculty of Computing",              degree: "B.Sc. in Computer Science",     year: "3rd Year", bio: "Passionate cricketer and tech enthusiast."        },
    { email: "bimali.f@student.kln.ac.lk",   faculty: "Faculty of Science",                degree: "B.Sc. in Biology",              year: "2nd Year", bio: "Swimming and athletics are my life."               },
    { email: "chathura.s@student.kln.ac.lk", faculty: "Faculty of Engineering",            degree: "B.Eng. in Civil Engineering",   year: "4th Year", bio: "Football captain of my faculty team."              },
    { email: "dilini.j@student.kln.ac.lk",   faculty: "Faculty of Management",             degree: "BBA in Business Administration",year: "2nd Year", bio: "Badminton player; love outdoor sports."            },
    { email: "eshan.r@student.kln.ac.lk",    faculty: "Faculty of Computing",              degree: "B.Sc. in IT",                   year: "1st Year", bio: "Track & field sprinter, aiming for nationals."    },
    { email: "fathima.n@student.kln.ac.lk",  faculty: "Faculty of Humanities",             degree: "B.A. in Sociology",             year: "3rd Year", bio: "Volleyball and table tennis enthusiast."           },
    { email: "gimhan.b@student.kln.ac.lk",   faculty: "Faculty of Engineering",            degree: "B.Eng. in Electrical Eng.",     year: "2nd Year", bio: "Basketball guard; part-time cricket fan."          },
    { email: "hiruni.m@student.kln.ac.lk",   faculty: "Faculty of Science",                degree: "B.Sc. in Chemistry",            year: "3rd Year", bio: "Competitive swimmer and fitness advocate."         },
    { email: "isuru.g@student.kln.ac.lk",    faculty: "Faculty of Computing",              degree: "B.Sc. in Software Engineering", year: "4th Year", bio: "All-rounder – cricket, football and badminton."    },
    { email: "janani.k@student.kln.ac.lk",   faculty: "Faculty of Management",             degree: "B.Com. in Accountancy",         year: "1st Year", bio: "New athlete, eager to represent the university."   },
    { email: "kasun.t@student.kln.ac.lk",    faculty: "Faculty of Engineering",            degree: "B.Eng. in Mechanical Eng.",     year: "2nd Year", bio: "Football striker with national school colours."    },
    { email: "lakmali.d@student.kln.ac.lk",  faculty: "Faculty of Science",                degree: "B.Sc. in Physics",              year: "1st Year", bio: "Athletics long-jumper; aspiring to break records." },
  ];

  for (const p of profileData) {
    const uid = userIds[p.email];
    if (!uid) continue;
    await pool.query(
      `INSERT INTO student_profiles (user_id, faculty, degree, year_of_study, bio)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE faculty=VALUES(faculty), degree=VALUES(degree), year_of_study=VALUES(year_of_study), bio=VALUES(bio)`,
      [uid, p.faculty, p.degree, p.year, p.bio]
    );
    await pool.query(
      `INSERT INTO user_profiles (user_id, department, year_of_study, bio)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE department=VALUES(department), year_of_study=VALUES(year_of_study), bio=VALUES(bio)`,
      [uid, p.faculty, p.year, p.bio]
    );
    log(`  ✓ Profile: ${p.email}`);
  }

  const adminId = userIds["admin@kln.ac.lk"];

  // ── 4. ENROLLMENTS ────────────────────────────────────────────
  log("\n4. Seeding sport enrollments...");

  // Each student → which sports → status + squad_level
  const enrollments = [
    // Cricket
    { email: "ashan.p@student.kln.ac.lk",    sport: "Cricket",    status: "APPROVED", level: "SQUAD" },
    { email: "chathura.s@student.kln.ac.lk", sport: "Cricket",    status: "APPROVED", level: "SQUAD" },
    { email: "gimhan.b@student.kln.ac.lk",   sport: "Cricket",    status: "APPROVED", level: "POOL"  },
    { email: "isuru.g@student.kln.ac.lk",    sport: "Cricket",    status: "APPROVED", level: "NONE"  },
    { email: "kasun.t@student.kln.ac.lk",    sport: "Cricket",    status: "PENDING",  level: "NONE"  },

    // Football
    { email: "chathura.s@student.kln.ac.lk", sport: "Football",   status: "APPROVED", level: "SQUAD" },
    { email: "kasun.t@student.kln.ac.lk",    sport: "Football",   status: "APPROVED", level: "SQUAD" },
    { email: "eshan.r@student.kln.ac.lk",    sport: "Football",   status: "APPROVED", level: "POOL"  },
    { email: "gimhan.b@student.kln.ac.lk",   sport: "Football",   status: "APPROVED", level: "NONE"  },
    { email: "ashan.p@student.kln.ac.lk",    sport: "Football",   status: "REJECTED", level: "NONE"  },

    // Swimming
    { email: "bimali.f@student.kln.ac.lk",   sport: "Swimming",   status: "APPROVED", level: "SQUAD" },
    { email: "hiruni.m@student.kln.ac.lk",   sport: "Swimming",   status: "APPROVED", level: "SQUAD" },
    { email: "janani.k@student.kln.ac.lk",   sport: "Swimming",   status: "APPROVED", level: "POOL"  },
    { email: "lakmali.d@student.kln.ac.lk",  sport: "Swimming",   status: "PENDING",  level: "NONE"  },

    // Badminton
    { email: "dilini.j@student.kln.ac.lk",   sport: "Badminton",  status: "APPROVED", level: "SQUAD" },
    { email: "fathima.n@student.kln.ac.lk",  sport: "Badminton",  status: "APPROVED", level: "POOL"  },
    { email: "isuru.g@student.kln.ac.lk",    sport: "Badminton",  status: "APPROVED", level: "NONE"  },
    { email: "bimali.f@student.kln.ac.lk",   sport: "Badminton",  status: "PENDING",  level: "NONE"  },

    // Athletics
    { email: "eshan.r@student.kln.ac.lk",    sport: "Athletics",  status: "APPROVED", level: "SQUAD" },
    { email: "lakmali.d@student.kln.ac.lk",  sport: "Athletics",  status: "APPROVED", level: "POOL"  },
    { email: "bimali.f@student.kln.ac.lk",   sport: "Athletics",  status: "APPROVED", level: "NONE"  },

    // Volleyball
    { email: "fathima.n@student.kln.ac.lk",  sport: "Volleyball", status: "APPROVED", level: "SQUAD" },
    { email: "janani.k@student.kln.ac.lk",   sport: "Volleyball", status: "APPROVED", level: "POOL"  },
    { email: "dilini.j@student.kln.ac.lk",   sport: "Volleyball", status: "APPROVED", level: "NONE"  },

    // Basketball
    { email: "gimhan.b@student.kln.ac.lk",   sport: "Basketball", status: "APPROVED", level: "SQUAD" },
    { email: "chathura.s@student.kln.ac.lk", sport: "Basketball", status: "APPROVED", level: "POOL"  },
    { email: "kasun.t@student.kln.ac.lk",    sport: "Basketball", status: "PENDING",  level: "NONE"  },

    // Table Tennis
    { email: "fathima.n@student.kln.ac.lk",  sport: "Table Tennis", status: "APPROVED", level: "SQUAD" },
    { email: "isuru.g@student.kln.ac.lk",    sport: "Table Tennis", status: "APPROVED", level: "POOL"  },
    { email: "hiruni.m@student.kln.ac.lk",   sport: "Table Tennis", status: "APPROVED", level: "NONE"  },
  ];

  const enrollmentIds = {};
  for (const e of enrollments) {
    const uid = userIds[e.email];
    const sid = sportIds[e.sport];
    if (!uid || !sid) continue;

    const key = `${uid}_${sid}`;
    const [existing] = await pool.query(
      "SELECT id FROM sport_enrollments WHERE sport_id=? AND student_user_id=? LIMIT 1",
      [sid, uid]
    );
    if (existing.length > 0) {
      enrollmentIds[key] = existing[0].id;
      // Update squad_level if approved
      if (e.status === "APPROVED") {
        await pool.query(
          "UPDATE sport_enrollments SET status=?, squad_level=?, decided_at=NOW(), decided_by_admin_id=? WHERE id=?",
          [e.status, e.level, adminId, existing[0].id]
        );
      }
      log(`  ↩ Enrollment exists: ${e.email} → ${e.sport}`);
    } else {
      const decidedAt   = e.status !== "PENDING" ? new Date() : null;
      const decidedBy   = e.status !== "PENDING" ? adminId   : null;
      const [r] = await pool.query(
        `INSERT INTO sport_enrollments
           (sport_id, student_user_id, status, squad_level, requested_at, decided_at, decided_by_admin_id)
         VALUES (?, ?, ?, ?, NOW(), ?, ?)`,
        [sid, uid, e.status, e.level, decidedAt, decidedBy]
      );
      enrollmentIds[key] = r.insertId;
      log(`  ✓ Enrolled ${e.email} → ${e.sport} [${e.status}/${e.level}]`);
    }
  }

  // ── 5. ATTENDANCE SESSIONS + ATTENDANCE ───────────────────────
  log("\n5. Seeding attendance sessions & records...");

  // Reference dates (past 30 days, every Mon/Wed/Fri)
  const today = new Date();
  const sessionDates = [];
  for (let i = 30; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dow = d.getDay(); // 0=Sun 1=Mon 2=Tue...
    if ([1, 3, 5].includes(dow)) sessionDates.push(d); // Mon, Wed, Fri
  }

  const sessionSportNames = ["Cricket", "Football", "Swimming", "Badminton", "Athletics", "Volleyball", "Basketball", "Table Tennis"];
  const sessionIds = {}; // sportName → [session_id]

  for (const sportName of sessionSportNames) {
    const sid = sportIds[sportName];
    if (!sid) continue;
    sessionIds[sportName] = [];

    for (const d of sessionDates) {
      const dateStr = d.toISOString().split("T")[0];
      const [existing] = await pool.query(
        "SELECT id FROM attendance_sessions WHERE sport_id=? AND session_date=?",
        [sid, dateStr]
      );
      let sessId;
      if (existing.length > 0) {
        sessId = existing[0].id;
      } else {
        const [r] = await pool.query(
          "INSERT INTO attendance_sessions (sport_id, location, session_date) VALUES (?, ?, ?)",
          [sid, "Sports Ground", dateStr]
        );
        sessId = r.insertId;
      }
      sessionIds[sportName].push({ id: sessId, date: dateStr });
    }
    log(`  ✓ ${sessionIds[sportName].length} sessions for ${sportName}`);
  }

  // Mark attendance — students attend 70–95% of sessions
  const attendanceEnrollments = enrollments.filter(e => e.status === "APPROVED");
  for (const e of attendanceEnrollments) {
    const uid  = userIds[e.email];
    const sid  = sportIds[e.sport];
    const sess = sessionIds[e.sport] || [];
    if (!uid || !sid || sess.length === 0) continue;

    // Higher level → higher attendance rate
    const rate = e.level === "SQUAD" ? 0.90 : e.level === "POOL" ? 0.75 : 0.60;
    let attended = 0;
    for (const s of sess) {
      if (Math.random() < rate) {
        await pool.query(
          `INSERT IGNORE INTO attendance (student_user_id, sport_id, session_id, session_date) VALUES (?, ?, ?, ?)`,
          [uid, sid, s.id, s.date]
        );
        attended++;
      }
    }
    log(`  ✓ Attendance: ${e.email} → ${e.sport} (${attended}/${sess.length})`);
  }

  // ── 6. PERFORMANCE ENTRIES ────────────────────────────────────
  log("\n6. Seeding performance entries...");

  // Base scores per level — realistic variation
  const scoreBase = (level, type) => {
    const bases = {
      SQUAD: { MATCH: 78, FITNESS: 82, DISCIPLINE: 88 },
      POOL:  { MATCH: 65, FITNESS: 70, DISCIPLINE: 75 },
      NONE:  { MATCH: 52, FITNESS: 58, DISCIPLINE: 65 },
    };
    const base = bases[level]?.[type] ?? 60;
    return Math.min(100, Math.max(30, base + (Math.random() * 20 - 10)));
  };

  const metricMap = {
    MATCH:      { Cricket: "Runs Scored", Football: "Goals & Assists", Swimming: "Race Time (pts)", Badminton: "Match Points", Athletics: "Sprint Score", Volleyball: "Rally Score", Basketball: "Match Points", "Table Tennis": "Game Points" },
    FITNESS:    { Cricket: "Stamina Score", Football: "Endurance Index", Swimming: "Lap Efficiency", Badminton: "Agility Score", Athletics: "Fitness Index", Volleyball: "Jump Height (pts)", Basketball: "Sprint & Stamina", "Table Tennis": "Reaction Score" },
    DISCIPLINE: { Cricket: "Discipline Rating", Football: "Conduct Score", Swimming: "Punctuality Score", Badminton: "Sportsmanship", Athletics: "Training Discipline", Volleyball: "Team Spirit", Basketball: "Court Discipline", "Table Tennis": "Fair Play Score" },
  };

  for (const e of attendanceEnrollments) {
    const uid  = userIds[e.email];
    const sid  = sportIds[e.sport];
    if (!uid || !sid) continue;

    for (const type of ["MATCH", "FITNESS", "DISCIPLINE"]) {
      // 3 entries per type (across last 30 days)
      for (let i = 0; i < 3; i++) {
        const val    = parseFloat(scoreBase(e.level, type).toFixed(1));
        const metric = metricMap[type][e.sport] || "Score";
        const daysAgo= Math.floor(Math.random() * 28) + 1;
        const recDate= new Date(today);
        recDate.setDate(today.getDate() - daysAgo);

        await pool.query(
          `INSERT INTO performance_entries (event_division_id, student_user_id, sport_id, type, metric, value, created_by_admin_id, created_at)
           VALUES (NULL, ?, ?, ?, ?, ?, ?, ?)`,
          [uid, sid, type, metric, val, adminId, recDate]
        );
      }
    }
    log(`  ✓ Performance entries: ${e.email} → ${e.sport}`);
  }

  // ── 7. EVENTS + EVENT DIVISIONS ──────────────────────────────
  log("\n7. Seeding events & event divisions...");

  const eventDivisions = {
    "Cricket":     ["Group Stage", "Quarterfinal", "Final"],
    "Football":    ["First Half",  "Second Half"],
    "Swimming":    ["Freestyle",   "Backstroke",   "Relay"],
    "Badminton":   ["Round 1",     "Semifinal",    "Final"],
    "Athletics":   ["100m Sprint", "400m Race",    "Long Jump"],
    "Volleyball":  ["Set 1",       "Set 2",        "Set 3"],
    "Basketball":  ["Pool A",      "Pool B",       "Final"],
    "Table Tennis":["Round Robin", "Knockout"],
  };

  function daysFromNow(n) {
    const d = new Date(today);
    d.setDate(today.getDate() + n);
    return d.toISOString().split("T")[0];
  }

  const eventsData = [
    { title: "Inter-Faculty Cricket Tournament",   sport: "Cricket",      venue: "KLN Main Oval",         date: daysFromNow(7),  time: "08:00", desc: "Annual inter-faculty 20-over cricket tournament. All faculty teams participate." },
    { title: "KLN Football Championship Finals",   sport: "Football",     venue: "Sports Ground A",       date: daysFromNow(14), time: "14:00", desc: "Championship final match. Top 2 teams from the league face off for the title." },
    { title: "University Swimming Gala",            sport: "Swimming",     venue: "University Pool",       date: daysFromNow(5),  time: "07:30", desc: "Annual swimming gala featuring freestyle, backstroke, and relay events." },
    { title: "Badminton Open - Singles",            sport: "Badminton",    venue: "Indoor Sports Hall",    date: daysFromNow(10), time: "16:00", desc: "Open singles tournament for all KLN students. Register before closing date." },
    { title: "Athletics Day - Track & Field",       sport: "Athletics",    venue: "University Track",      date: daysFromNow(21), time: "06:00", desc: "Full-day athletics event: 100m, 400m, 1500m, relays, long jump, high jump." },
    { title: "Volleyball League - Semifinal Round", sport: "Volleyball",   venue: "Outdoor Courts",        date: daysFromNow(3),  time: "16:30", desc: "Semifinal round of the KLN Volleyball League. Top 4 teams compete." },
    { title: "Basketball 3v3 Challenge",            sport: "Basketball",   venue: "Indoor Sports Hall B",  date: daysFromNow(12), time: "15:00", desc: "A fast-paced 3v3 basketball challenge open to all students." },
    { title: "Table Tennis Club Championship",      sport: "Table Tennis", venue: "Recreation Centre",     date: daysFromNow(18), time: "14:00", desc: "Annual TT club championship. Round-robin format followed by knockouts." },
    { title: "Sports Inauguration Ceremony 2026",   sport: null,           venue: "University Auditorium", date: daysFromNow(2),  time: "10:00", desc: "Official inauguration of the 2026 sports season. All athletes are invited." },
  ];

  for (const ev of eventsData) {
    const sid = ev.sport ? sportIds[ev.sport] : null;
    const [r] = await pool.query(
      `INSERT INTO events (admin_id, title, description, sport_tag, sport_id, venue, event_date, event_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [adminId, ev.title, ev.desc, ev.sport, sid, ev.venue, ev.date, ev.time]
    );
    const eventId = r.insertId;
    log(`  ✓ Event: ${ev.title} (id=${eventId})`);

    // Seed event divisions for this event
    const divNames = ev.sport ? (eventDivisions[ev.sport] || ["General"]) : ["Opening"];
    for (const divName of divNames) {
      await pool.query(
        `INSERT INTO event_divisions (event_id, name) VALUES (?, ?)`,
        [eventId, divName]
      );
    }
    log(`  ✓   Divisions: ${divNames.join(", ")}`);
  }

  // ── 8. ANNOUNCEMENTS ──────────────────────────────────────────
  log("\n8. Seeding announcements...");
  const announcements = [
    { title: "Sports Season 2026 – Registration Open!", message: "All students are invited to register for the 2026 sports season. Visit the Sports Office before April 30 to complete your registration.", sport: null },
    { title: "Cricket Practice Schedule Update", message: "Due to field maintenance, cricket practice on Monday 21 April is moved to Sports Ground B. Normal venue resumes from Wednesday.", sport: "Cricket" },
    { title: "Swimming Compulsory Medical Checkup", message: "All swimming squad members must submit a medical clearance certificate to the Sports Office by the end of this week.", sport: "Swimming" },
    { title: "Outstanding Performance – Football Team!", message: "Congratulations to our Football team on winning the Zonal Championship! The final match result was 3-1. Well done to all players.", sport: "Football" },
    { title: "New Sports Equipment Available", message: "New badminton rackets, cricket gear, and swimming equipment are now available for borrowing from the Sports Storeroom. Bring your student ID.", sport: null },
    { title: "Athletics Training Camp – Volunteers Needed", message: "We are looking for volunteer assistants for the Athletics Training Camp on 25–26 April. Contact the Sports Coordinator to sign up.", sport: "Athletics" },
  ];

  for (const a of announcements) {
    const sid = a.sport ? sportIds[a.sport] : null;
    const [r] = await pool.query(
      "INSERT INTO announcements (sport_id, title, message) VALUES (?, ?, ?)",
      [sid, a.title, a.message]
    );
    log(`  ✓ Announcement: "${a.title}" (id=${r.insertId})`);
  }

  // ── 9. POSTS (Social Feed) ────────────────────────────────────
  log("\n9. Seeding social feed posts...");
  const posts = [
    { email: "admin@kln.ac.lk",               role: "ADMIN",   sport: null,         content: "🏅 Welcome to the EKEL Sport portal! This is your hub for all sports activities at KLN. Stay tuned for updates, events, and achievements.", likes: 12 },
    { email: "chathura.s@student.kln.ac.lk",  role: "STUDENT", sport: "Football",   content: "Just had an incredible practice session today ⚽🔥 The team chemistry is really coming together ahead of the finals. COYB! 💪", likes: 8 },
    { email: "admin@kln.ac.lk",               role: "ADMIN",   sport: "Cricket",    content: "🏏 Cricket squad training resumes on Wednesday after the maintenance break. Please be at the oval by 5:45 AM for warm-ups.", likes: 5 },
    { email: "bimali.f@student.kln.ac.lk",    role: "STUDENT", sport: "Swimming",   content: "Broke my personal best today in the 100m freestyle! 🌊 Feeling confident for the University Swimming Gala next week. Wish me luck!", likes: 15 },
    { email: "ashan.p@student.kln.ac.lk",     role: "STUDENT", sport: "Cricket",    content: "Hit a 50 in today's intra-squad match 🏏 Hard work is finally paying off. Big thanks to Coach Chaminda for the extra sessions!", likes: 10 },
    { email: "admin@kln.ac.lk",               role: "ADMIN",   sport: null,         content: "📢 Reminder: All squad members must submit their medical clearance forms to the Sports Office before Friday.", likes: 6 },
    { email: "eshan.r@student.kln.ac.lk",     role: "STUDENT", sport: "Athletics",  content: "Morning track session done ✅ Sub-12 seconds on the 100m today! Pushing for the university record at Athletics Day 🏃‍♂️💨", likes: 20 },
    { email: "dilini.j@student.kln.ac.lk",    role: "STUDENT", sport: "Badminton",  content: "So excited for the Badminton Open next week! 🏸 Been putting in extra hours at the indoor hall every evening. Let's go!", likes: 7 },
    { email: "fathima.n@student.kln.ac.lk",   role: "STUDENT", sport: "Volleyball", content: "Semis are coming 🏐 Our team has been working so hard this season. Can't wait to show what we're made of on the court!", likes: 9 },
    { email: "gimhan.b@student.kln.ac.lk",    role: "STUDENT", sport: "Basketball", content: "3×3 Basketball challenge is going to be insane 🏀🔥 Our squad is ready. Who else is signing up? Drop your name below!", likes: 13 },
  ];

  for (const p of posts) {
    const uid  = userIds[p.email];
    if (!uid) continue;
    const [userRow] = await pool.query("SELECT full_name FROM users WHERE id=?", [uid]);
    const name = userRow[0]?.full_name || "User";

    // Insert post with a past timestamp
    const daysAgo = Math.floor(Math.random() * 14);
    const createdAt = new Date(today);
    createdAt.setDate(today.getDate() - daysAgo);

    const [r] = await pool.query(
      `INSERT INTO posts (author_id, author_name, author_role, sport_tag, content, likes_count, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uid, name, p.role, p.sport, p.content, p.likes, createdAt]
    );
    log(`  ✓ Post by ${name}: "${p.content.substring(0, 60)}..."`);
  }

  // ── 10. NOTIFICATIONS ─────────────────────────────────────────
  log("\n10. Seeding notifications...");

  // Notifications for all students
  const studentEmails = usersData.filter(u => u.role === "STUDENT").map(u => u.email);
  const commonNotifs = [
    { title: "Welcome to EKEL Sport! 🎉",            message: "Your account is active. Explore available sports and request enrollment.",          type: "SYSTEM" },
    { title: "Sports Season 2026 – Register Now!",   message: "Registration for the 2026 sports season is open. Hurry – limited spots available!", type: "ANNOUNCEMENT" },
    { title: "📅 New Event: Sports Inauguration",    message: "University Auditorium · April 20, 2026 at 10:00 AM. All athletes are invited.",      type: "SYSTEM" },
  ];

  for (const email of studentEmails) {
    const uid = userIds[email];
    if (!uid) continue;
    for (const n of commonNotifs) {
      await pool.query(
        "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
        [uid, n.title, n.message, n.type]
      );
    }
    log(`  ✓ Common notifications → ${email}`);
  }

  // Sport-specific notifications for approved enrollments
  const approvedEnrollments = enrollments.filter(e => e.status === "APPROVED");
  for (const e of approvedEnrollments) {
    const uid = userIds[e.email];
    if (!uid) continue;

    if (e.level === "SQUAD") {
      await pool.query(
        "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'SYSTEM')",
        [uid, `${e.sport} – Squad Selected 🏆`, `Congratulations! You have been selected to the ${e.sport} Squad. Keep up the excellent work!`]
      );
    } else if (e.level === "POOL") {
      await pool.query(
        "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'SYSTEM')",
        [uid, `${e.sport} – Pool Selected`, `You have been selected to the ${e.sport} Pool. Continue training hard to move to the Squad!`]
      );
    }

    await pool.query(
      "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'ENROLLMENT')",
      [uid, `Sport Enrollment APPROVED`, `Your request to join ${e.sport} has been approved. Welcome to the team!`]
    );
  }
  log(`  ✓ Sport-specific notifications added for ${approvedEnrollments.length} enrollments`);

  // ── 11. TEAM ASSIGNMENTS ──────────────────────────────────────
  log("\n11. Seeding student team assignments...");
  const teamAssignments = enrollments.filter(e => e.status === "APPROVED" && e.level === "SQUAD");
  for (const e of teamAssignments) {
    const uid = userIds[e.email];
    const sid = sportIds[e.sport];
    if (!uid || !sid) continue;
    await pool.query(
      `INSERT INTO student_team_assignment (sport_id, student_user_id, assigned_by_admin_id, level)
       VALUES (?, ?, ?, 'SQUAD')
       ON DUPLICATE KEY UPDATE level='SQUAD'`,
      [sid, uid, adminId]
    );
    log(`  ✓ Team assignment: ${e.email} → ${e.sport} [SQUAD]`);
  }

  // ── 12. EVENT TEAM MEMBERS ────────────────────────────────────
  log("\n12. Seeding event team members...");
  // Fetch the first division per event (compatible with ONLY_FULL_GROUP_BY)
  const [divRows] = await pool.query(
    `SELECT ed.id AS div_id, ed.event_id, e.sport_id
     FROM event_divisions ed
     JOIN events e ON e.id = ed.event_id
     WHERE e.sport_id IS NOT NULL
       AND ed.id IN (
         SELECT MIN(ed2.id) FROM event_divisions ed2
         JOIN events e2 ON e2.id = ed2.event_id
         WHERE e2.sport_id IS NOT NULL
         GROUP BY ed2.event_id
       )
     ORDER BY ed.event_id ASC
     LIMIT 4`
  );
  for (const div of divRows) {
    const [squadMembers] = await pool.query(
      `SELECT DISTINCT se.student_user_id
       FROM sport_enrollments se
       WHERE se.sport_id = ? AND se.status = 'APPROVED' AND se.squad_level = 'SQUAD'
       LIMIT 3`,
      [div.sport_id]
    );
    for (const m of squadMembers) {
      await pool.query(
        `INSERT IGNORE INTO event_team_members (event_division_id, student_user_id)
         VALUES (?, ?)`,
        [div.div_id, m.student_user_id]
      );
    }
    log(`  ✓ Division ${div.div_id} (event ${div.event_id}): assigned ${squadMembers.length} squad members`);
  }

  // ─── DONE ─────────────────────────────────────────────────────
  console.log("\n=========================================");
  console.log("  ✅  SEED COMPLETE — Summary:");
  console.log("=========================================");
  const tables = [
    "users","sports","sport_enrollments","attendance_sessions",
    "attendance","performance_entries","events","event_divisions","announcements",
    "posts","notifications","student_team_assignment","event_team_members"
  ];
  for (const t of tables) {
    try {
      const [[{ cnt }]] = await pool.query(`SELECT COUNT(*) AS cnt FROM \`${t}\``);
      console.log(`  ${t.padEnd(32)} → ${String(cnt).padStart(4)} rows`);
    } catch(_) {
      console.log(`  ${t.padEnd(32)} → (table not found)`);
    }
  }
  console.log("\n  Credentials:");
  console.log("  ADMIN     → admin@kln.ac.lk         / Admin@123");
  console.log("  ADVISORY  → n.wickramasinghe@kln.ac.lk / Advisory@123");
  console.log("  STUDENT   → ashan.p@student.kln.ac.lk  / Student@123");
  console.log("  STUDENT   → bimali.f@student.kln.ac.lk / Student@123");
  console.log("  (All students use password: Student@123)\n");

  await pool.end();
}

seed().catch((err) => {
  console.error("\n❌ SEED FAILED:", err.message);
  process.exit(1);
});
