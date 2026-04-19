/**
 * studentValidator.js
 *
 * Centralized validation for University of Kelaniya student IDs and emails.
 *
 * Student ID Format:  DEPT/YEAR/NNN     e.g. IM/2022/048
 * Student Email:      name-deptYYnnn@stu.kln.ac.lk   e.g. desilva-im22048@stu.kln.ac.lk
 *   where YY = last 2 digits of year, nnn = 3-digit serial (same as ID)
 */

// ── Valid department codes ────────────────────────────────────────────────────
const VALID_DEPT_CODES = [
  // Faculty of Computing
  "IM",  // Information Management
  "CS",  // Computer Science
  "IT",  // Information Technology
  "SE",  // Software Engineering
  "DS",  // Data Science
  // Faculty of Science & Technology
  "SC",  // Science (general)
  "BIO", // Biology
  "CHE", // Chemistry
  "PHY", // Physics
  "PS",  // Physical Science (Physics+CS)
  // Faculty of Engineering
  "CE",  // Civil Engineering
  "EE",  // Electrical Engineering
  "ME",  // Mechanical Engineering
  "CH",  // Chemical Engineering
  // Faculty of Management
  "MG",  // Management
  "ACC", // Accountancy
  "ECO", // Economics
  "MKT", // Marketing
  // Faculty of Humanities & Social Sciences
  "SL",  // Sinhala / Language Studies
  "SOC", // Sociology
  "HIS", // History
  "EDU", // Education
  // Faculty of Medicine
  "MED", // Medicine
  // Faculty of Law
  "LAW", // Law
];

// ── Regexes ───────────────────────────────────────────────────────────────────
// Student ID: DEPT/YEAR/NNN  (dept = 2–4 uppercase letters, year = 4 digits, serial = exactly 3 digits)
const STUDENT_ID_REGEX = /^([A-Z]{2,4})\/(\d{4})\/(\d{3})$/;

// Student email: <username>-<dept_lower><year2><serial3>@stu.kln.ac.lk
// dept_lower = 2–4 lowercase letters, year2 = 2 digits, serial3 = 3 digits
const STUDENT_EMAIL_REGEX = /^[a-z0-9._-]+-([a-z]{2,4})(\d{2})(\d{3})@stu\.kln\.ac\.lk$/;

// ── Parsers ───────────────────────────────────────────────────────────────────
function parseStudentId(studentId) {
  const m = STUDENT_ID_REGEX.exec(String(studentId || "").trim().toUpperCase());
  if (!m) return null;
  return { dept: m[1], year: m[2], number: m[3] };
}

function parseStudentEmail(email) {
  const m = STUDENT_EMAIL_REGEX.exec(String(email || "").trim().toLowerCase());
  if (!m) return null;
  return { dept: m[1].toUpperCase(), yearShort: m[2], number: m[3] };
}

// ── Validators ────────────────────────────────────────────────────────────────
/**
 * Returns null if valid, or an error message string if invalid.
 */
function validateStudentId(studentId) {
  const parts = parseStudentId(studentId);
  if (!parts) {
    return "Invalid Student ID format. Use: DEPT/YEAR/NNN (e.g. IM/2022/048)";
  }
  if (!VALID_DEPT_CODES.includes(parts.dept)) {
    return `Unknown department code "${parts.dept}". Valid codes: ${VALID_DEPT_CODES.join(", ")}`;
  }
  const year = parseInt(parts.year, 10);
  const currentYear = new Date().getFullYear();
  if (year < 2000 || year > currentYear + 1) {
    return `Year ${parts.year} in Student ID is out of range (2000–${currentYear + 1})`;
  }
  return null; // valid
}

/**
 * Returns null if valid, or an error message string if invalid.
 */
function validateStudentEmail(email) {
  const parts = parseStudentEmail(email);
  if (!parts) {
    return "Invalid student email. Use format: desilva-im22048@stu.kln.ac.lk";
  }
  if (!VALID_DEPT_CODES.includes(parts.dept)) {
    return `Unknown department code "${parts.dept}" in email suffix`;
  }
  return null; // valid
}

/**
 * Cross-validates that the Student ID and email refer to the same student.
 * Returns null if consistent, or an error message string if not.
 */
function validateConsistency(studentId, email) {
  const idParts = parseStudentId(studentId);
  const emParts = parseStudentEmail(email);
  if (!idParts || !emParts) return "Cannot validate — fix Student ID and email formats first";

  const yearShort = idParts.year.slice(2); // "2022" → "22"

  if (idParts.dept.toLowerCase() !== emParts.dept.toLowerCase()) {
    return `Department mismatch: Student ID says "${idParts.dept}" but email says "${emParts.dept.toUpperCase()}"`;
  }
  if (yearShort !== emParts.yearShort) {
    return `Year mismatch: Student ID year ${idParts.year} (suffix "${yearShort}") doesn't match email suffix "${emParts.yearShort}"`;
  }
  if (idParts.number !== emParts.number) {
    return `Serial number mismatch: Student ID has "${idParts.number}" but email has "${emParts.number}"`;
  }
  return null; // consistent
}

// ── Boolean helpers (for simple true/false checks) ────────────────────────────
const isValidStudentId    = (id)            => validateStudentId(id)    === null;
const isValidStudentEmail = (email)         => validateStudentEmail(email) === null;
const isConsistent        = (id, email)     => validateConsistency(id, email) === null;

module.exports = {
  VALID_DEPT_CODES,
  parseStudentId,
  parseStudentEmail,
  validateStudentId,
  validateStudentEmail,
  validateConsistency,
  isValidStudentId,
  isValidStudentEmail,
  isConsistent,
};
