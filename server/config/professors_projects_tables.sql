-- Professors table for storing faculty information
CREATE TABLE IF NOT EXISTS professors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  specialization VARCHAR(255),
  description TEXT,
  image_url VARCHAR(255),
  website_url VARCHAR(255),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Projects table for storing research projects
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type ENUM('Research', 'Development', 'Industry', 'Academic') DEFAULT 'Research',
  startDate DATE NOT NULL,
  endDate DATE,
  professor_id INT,
  status ENUM('Ongoing', 'Completed', 'Planned') DEFAULT 'Ongoing',
  technologies JSON,
  members JSON,
  funding_source VARCHAR(255),
  funding_amount DECIMAL(10,2),
  publication_url VARCHAR(255),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (professor_id) REFERENCES professors(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Sample data for professors
INSERT INTO professors (name, title, email, specialization, department, description, image_url, website_url)
VALUES 
('Dr. Anand Kumar', 'Associate Professor', 'anand@iiitd.ac.in', 'Post-Quantum Cryptography', 'Computer Science', 'Dr. Kumar specializes in post-quantum cryptography and has published extensively in the field.', '/images/professors/anand-kumar.jpg', 'https://faculty.iiitd.ac.in/anand'),
('Dr. Sneha Sharma', 'Assistant Professor', 'sneha@iiitd.ac.in', 'Blockchain Security', 'Information Security', 'Dr. Sharma focuses on blockchain security and distributed systems.', '/images/professors/sneha-sharma.jpg', 'https://faculty.iiitd.ac.in/sneha'),
('Dr. Rajiv Mehta', 'Professor', 'rajiv@iiitd.ac.in', 'Cryptanalysis', 'Mathematics', 'Dr. Mehta is an expert in cryptanalysis and secure system design.', '/images/professors/rajiv-mehta.jpg', 'https://faculty.iiitd.ac.in/rajiv');

-- Sample data for projects
INSERT INTO projects (title, description, type, startDate, endDate, professor_id, status, technologies, members, funding_source)
VALUES 
('Quantum-Resistant Encryption Algorithms', 'Developing encryption algorithms that can withstand attacks from quantum computers.', 'Research', '2024-01-15', '2025-12-31', 1, 'Ongoing', '["Quantum Computing", "Lattice-based Cryptography", "Python", "C++"]', '["Rahul Gupta", "Priya Singh", "Amit Kumar"]', 'Department of Science and Technology'),
('Secure Blockchain Voting System', 'Creating a tamper-proof voting system using blockchain technology.', 'Development', '2023-06-01', '2024-05-31', 2, 'Completed', '["Blockchain", "Ethereum", "Solidity", "Web3.js"]', '["Neha Verma", "Sanjay Patel", "Divya Reddy"]', 'Election Commission of India'),
('Homomorphic Encryption for Healthcare Data', 'Implementing homomorphic encryption techniques for secure processing of sensitive healthcare data.', 'Industry', '2024-03-01', '2026-02-28', 3, 'Ongoing', '["Homomorphic Encryption", "SEAL", "C++", "Python", "TensorFlow"]', '["Vikram Singh", "Ananya Desai", "Karan Malhotra", "Meera Joshi"]', 'Ministry of Health');
