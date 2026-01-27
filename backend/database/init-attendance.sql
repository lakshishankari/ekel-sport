-- Attendance tracking table
CREATE TABLE IF NOT EXISTS attendance (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_user_id BIGINT UNSIGNED NOT NULL,
  sport_id INT UNSIGNED NOT NULL,
  session_date DATE NOT NULL,
  attended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (student_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE CASCADE,
  
  -- Ensure unique attendance per student per sport per day
  UNIQUE KEY unique_attendance (student_user_id, sport_id, session_date),
  
  -- Indexes for performance
  INDEX idx_student_user (student_user_id),
  INDEX idx_sport (sport_id),
  INDEX idx_session_date (session_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


