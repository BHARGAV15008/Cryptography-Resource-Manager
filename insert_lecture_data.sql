-- Insert courses
INSERT INTO courses (id, title, code, description, semester, year, professor_id, created_at, updated_at)
VALUES 
(1, 'Introduction to Cryptography', 'CRYPT101', 'An introductory course to cryptography concepts', 'Fall', 2023, NULL, NOW(), NOW()),
(2, 'Advanced Encryption', 'CRYPT201', 'Advanced topics in modern encryption techniques', 'Spring', 2023, NULL, NOW(), NOW());

-- Insert lectures
INSERT INTO lectures (id, title, course_id, lecture_date, description, slides_url, video_url, created_at, updated_at)
VALUES 
(1, 'Symmetric Key Cryptography', 1, '2023-09-15', 'Introduction to symmetric key algorithms', '/uploads/lectures/slides1.pdf', 'https://example.com/video1.mp4', NOW(), NOW()),
(2, 'Public Key Infrastructure', 2, '2023-10-20', 'Understanding PKI and its applications', '/uploads/lectures/slides2.pdf', 'https://example.com/video2.mp4', NOW(), NOW());
