-- Drop the existing projects table if it exists
DROP TABLE IF EXISTS projects;

-- Create a simplified projects table
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'Research',
  startDate DATE,
  endDate DATE,
  professor_id INT,
  status VARCHAR(50) DEFAULT 'Ongoing',
  technologies JSON,
  members JSON,
  publication_url VARCHAR(255),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (professor_id) REFERENCES professors(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
