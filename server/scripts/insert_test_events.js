// Script to insert test events into the database
const mysql = require('mysql2/promise');
require('dotenv').config();

async function insertTestEvents() {
  try {
    // Create database connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '12345',
      database: process.env.DB_NAME || 'cryptography_resources'
    });

    console.log('Connected to database');

    // First, clear existing events
    await connection.execute('DELETE FROM events');
    console.log('Cleared existing events');

    // Insert test events
    const events = [
      {
        title: 'Cryptography Workshop 2025',
        description: 'A hands-on workshop covering modern cryptographic techniques and their applications in cybersecurity.',
        startDate: '2025-06-15 09:00:00',
        endDate: '2025-06-15 17:00:00',
        location: 'Virtual Event',
        organizerName: 'Cryptography Research Group',
        eventType: 'workshop',
        imageUrl: '/images/placeholder-event.jpg',
        status: 'approved'
      },
      {
        title: 'Blockchain Security Conference',
        description: 'Explore the latest advancements in blockchain security and cryptographic protocols.',
        startDate: '2025-07-10 10:00:00',
        endDate: '2025-07-12 18:00:00',
        location: 'New Delhi, India',
        organizerName: 'Indian Cryptography Association',
        eventType: 'conference',
        imageUrl: '/images/placeholder-event.jpg',
        status: 'approved'
      },
      {
        title: 'Quantum Cryptography Symposium',
        description: 'A deep dive into quantum cryptography and its implications for future security systems.',
        startDate: '2025-08-22 09:30:00',
        endDate: '2025-08-23 16:30:00',
        location: 'Mumbai, India',
        organizerName: 'Quantum Computing India',
        eventType: 'symposium',
        imageUrl: '/images/placeholder-event.jpg',
        status: 'approved'
      }
    ];

    // Insert each event
    for (const event of events) {
      await connection.execute(
        `INSERT INTO events (
          title, description, startDate, endDate, location, 
          organizerName, eventType, imageUrl, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          event.title,
          event.description,
          event.startDate,
          event.endDate,
          event.location,
          event.organizerName,
          event.eventType,
          event.imageUrl,
          event.status
        ]
      );
      console.log(`Inserted event: ${event.title}`);
    }

    console.log('All test events inserted successfully');
    
    // Verify events were inserted
    const [rows] = await connection.execute('SELECT * FROM events');
    console.log(`Verified ${rows.length} events in database`);
    
    // Close connection
    await connection.end();
    console.log('Database connection closed');

  } catch (error) {
    console.error('Error inserting test events:', error);
  }
}

// Run the function
insertTestEvents();
