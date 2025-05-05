const express = require('express');
const router = express.Router();
const { getExternalEvents } = require('../services/eventService');
const db = require('../config/db');

// Helper function to get a database connection
const getConnection = async () => {
  return await db.getConnection();
};

/**
 * @route GET /api/events
 * @desc Get all events with optional filtering
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/events - Fetching all events');
    const {
      source,
      category,
      search,
      startDate,
      featured,
      page = 1,
      limit = 10
    } = req.query;
    
    let dbEvents = [];
    
    try {
      const connection = await getConnection();
      
      // Build query dynamically based on filters
      let query = 'SELECT * FROM events WHERE 1=1';
      const params = [];
      
      // Add filters
      if (source) {
        // Handle multiple sources
        if (Array.isArray(source)) {
          const placeholders = source.map(() => '?').join(', ');
          query += ` AND source IN (${placeholders})`;
          params.push(...source);
        } else {
          query += ' AND source = ?';
          params.push(source);
        }
      }
      
      if (category) {
        query += ' AND eventType = ?';
        params.push(category);
      }
      
      if (search) {
        query += ' AND (title LIKE ? OR description LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm);
      }
      
      if (startDate) {
        query += ' AND startDate >= ?';
        params.push(new Date(startDate));
      }
      
      if (featured) {
        query += ' AND is_featured = ?';
        params.push(featured === 'true' ? 1 : 0);
      }
      
      // Simplified query - remove complex filters that might cause issues
      // Add sorting
      query += ' ORDER BY startDate ASC';
      
      // Add pagination - using direct values instead of parameters for LIMIT and OFFSET
      // This avoids the 'Incorrect arguments to mysqld_stmt_execute' error
      const offset = (page - 1) * limit;
      query += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
      
      console.log('Executing query:', query);
      console.log('With params:', params);
      
      const [rows] = await connection.execute(query, params);
      connection.release();
      
      console.log(`Found ${rows.length} events in database`);
      
      // Transform database results to match our schema
      dbEvents = rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description || null,
        startDate: row.startDate,
        endDate: row.endDate || new Date(new Date(row.startDate).getTime() + 86400000), // Default to next day
        location: row.location || 'Online',
        imageUrl: row.imageUrl || '/images/placeholder-event.jpg',
        eventType: row.eventType || 'conference',
        source: row.source || 'college',
        organizerName: row.organizerName || '',
        organizerEmail: row.organizer_email || null,
        registrationUrl: row.registration_url || null,
        isFeatured: row.is_featured === 1,
        status: row.status || 'pending'
      }));
      
      console.log(`Transformed ${dbEvents.length} events for response`);
      
      // If we got events from the database, return them directly
      if (dbEvents.length > 0) {
        return res.json(dbEvents);
      }
    } catch (dbError) {
      console.error('Database error:', dbError.message);
      console.error('Database error stack:', dbError.stack);
    }
    
    // Get events from external sources if not specifically requesting DB events
    let externalEvents = [];
    if (source !== 'college') {
      // Convert string source to array for filtering
      const sourceFilter = source ? 
        (Array.isArray(source) ? source : [source]) : 
        null;
      
      externalEvents = await getExternalEvents(sourceFilter);
      
      // Apply additional filters to external events
      if (category) {
        externalEvents = externalEvents.filter(event => 
          event.category.toLowerCase() === category.toLowerCase());
      }
      
      if (search) {
        const searchLower = search.toLowerCase();
        externalEvents = externalEvents.filter(event => 
          event.title.toLowerCase().includes(searchLower) || 
          event.description.toLowerCase().includes(searchLower));
      }
      
      if (startDate) {
        const startDateObj = new Date(startDate);
        externalEvents = externalEvents.filter(event => 
          new Date(event.startDate) >= startDateObj);
      }
      
      if (featured === 'true') {
        externalEvents = externalEvents.filter(event => event.isFeatured);
      }
      
      // Filter to only include cryptography, cryptology, cryptanalysis related events
      externalEvents = externalEvents.filter(event => {
        const title = event.title.toLowerCase();
        const desc = event.description.toLowerCase();
        return (
          title.includes('crypt') || 
          desc.includes('crypt') || 
          title.includes('cipher') ||
          desc.includes('cipher') || 
          title.includes('encryption') || 
          desc.includes('encryption')
        );
      });
    }
    
    // Combine and sort results
    const allEvents = [...dbEvents, ...externalEvents].sort((a, b) => 
      new Date(a.startDate) - new Date(b.startDate)
    );
    
    // Apply pagination if needed to combined results
    const paginatedEvents = allEvents.slice(0, parseInt(limit));
    
    res.json(paginatedEvents);
  } catch (error) {
    console.error('Error in GET /api/events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

/**
 * @route GET /api/events/:id
 * @desc Get single event by ID
 * @access Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Handle numeric IDs (database) differently from string IDs (external)
    if (!isNaN(id)) {
      const connection = await getConnection();
      const [rows] = await connection.execute(
        'SELECT * FROM events WHERE id = ?', 
        [id]
      );
      connection.release();
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      const row = rows[0];
      const event = {
        id: row.id,
        title: row.title,
        description: row.description,
        startDate: row.startDate,
        endDate: row.endDate,
        location: row.location,
        imageUrl: row.imageUrl || '/images/placeholder-event.jpg',
        category: row.eventType,
        source: row.source,
        organizerName: row.organizerName || '',
        organizerEmail: row.organizer_email || '',
        organizerImageUrl: '',
        registrationUrl: row.registration_url || '',
        isFeatured: row.is_featured === 1,
        status: row.status
      };
      
      return res.json(event);
    } else {
      // For external events, we'd need to maintain a cache or refetch
      // For this example, we'll return a not found
      return res.status(404).json({ message: 'External event details not available' });
    }
  } catch (error) {
    console.error('Error in GET /api/events/:id:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

/**
 * @route POST /api/events
 * @desc Create a new event
 * @access Private (Admin only)
 */
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/events - Creating new event');
    const {
      title,
      description,
      startDate,
      endDate,
      location,
      organizerName,
      organizerEmail,
      eventType,
      imageUrl
    } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!startDate) {
      return res.status(400).json({ error: 'Start date is required' });
    }

    // Format dates
    const formattedStartDate = new Date(startDate);
    const formattedEndDate = endDate ? new Date(endDate) : new Date(formattedStartDate.getTime() + 24 * 60 * 60 * 1000);
    
    // Handle image URL - if it's a data URL, we'll save it to a file
    let finalImageUrl = imageUrl;
    if (imageUrl && imageUrl.startsWith('data:image')) {
      try {
        const fs = require('fs');
        const path = require('path');
        
        // Save to the public directory instead
        const publicDir = path.join(__dirname, '../public');
        const uploadsDir = path.join(publicDir, 'uploads');
        const eventsDir = path.join(uploadsDir, 'events');
        
        // Ensure all directories exist
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        if (!fs.existsSync(eventsDir)) {
          fs.mkdirSync(eventsDir, { recursive: true });
        }
        
        // Generate a unique filename
        const timestamp = Date.now();
        const filename = `event_${timestamp}.jpg`;
        const filePath = path.join(eventsDir, filename);
        
        // Extract the base64 data from the data URL
        const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Write the file
        fs.writeFileSync(filePath, buffer);
        
        // Set the image URL to the relative path (this will be much shorter than the data URL)
        finalImageUrl = `/uploads/events/${filename}`;
        console.log('Saved image to:', filePath);
        console.log('Image URL set to:', finalImageUrl);
      } catch (imageError) {
        console.error('Error saving image:', imageError);
        // Continue with the event creation even if image saving fails
      }
    }

    console.log('Creating event with data:', {
      title,
      description: description || null,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      location: location || null,
      organizerName: organizerName || null,
      organizerEmail: organizerEmail || null,
      eventType: eventType || 'conference',
      imageUrl: finalImageUrl || null
    });

    const connection = await getConnection();
    
    // Insert the new event
    const [result] = await connection.execute(
      `INSERT INTO events (
        title, 
        description, 
        startDate, 
        endDate, 
        location, 
        organizerName, 
        eventType, 
        imageUrl, 
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        formattedStartDate,
        formattedEndDate,
        location || null,
        organizerName || null,
        eventType || 'conference',
        finalImageUrl || null,
        'pending'
      ]
    );
    
    connection.release();
    
    // Get the newly created event
    const eventId = result.insertId;
    
    // Return the created event
    const newEvent = {
      id: eventId,
      title,
      description: description || null,
      startDate,
      endDate,
      location: location || null,
      organizerName: organizerName || null,
      organizerEmail: organizerEmail || null,
      eventType: eventType || 'conference',
      imageUrl: imageUrl || null,
      source: 'college',
      status: 'pending'
    };
    
    console.log('Created new event:', newEvent);
    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error in POST /api/events:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

/**
 * @route PUT /api/events/:id
 * @desc Update an existing event
 * @access Private (Admin only)
 */
router.put('/:id', async (req, res) => {
  try {
    console.log('PUT /api/events/:id - Updating event');
    const id = req.params.id;
    const {
      title,
      description,
      startDate,
      endDate,
      location,
      organizerName,
      organizerEmail,
      eventType,
      imageUrl
    } = req.body;
    
    console.log('Request body:', req.body);
    console.log('Event ID:', id);

    // Validate required fields
    if (!title || !startDate) {
      return res.status(400).json({ message: 'Title and start date are required' });
    }

    // Format dates in MySQL compatible format (YYYY-MM-DD HH:MM:SS)
    const formatDate = (dateString) => {
      if (!dateString) return null;
      const date = new Date(dateString);
      return date.toISOString().slice(0, 19).replace('T', ' ');
    };

    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    
    // Handle image URL - if it's a data URL, we'll save it to a file
    let finalImageUrl = imageUrl;
    if (imageUrl && imageUrl.startsWith('data:image')) {
      try {
        const fs = require('fs');
        const path = require('path');
        
        // Save to the public directory instead
        const publicDir = path.join(__dirname, '../public');
        const uploadsDir = path.join(publicDir, 'uploads');
        const eventsDir = path.join(uploadsDir, 'events');
        
        // Ensure all directories exist
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        if (!fs.existsSync(eventsDir)) {
          fs.mkdirSync(eventsDir, { recursive: true });
        }
        
        // Generate a unique filename
        const timestamp = Date.now();
        const filename = `event_${timestamp}.jpg`;
        const filePath = path.join(eventsDir, filename);
        
        // Extract the base64 data from the data URL
        const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Write the file
        fs.writeFileSync(filePath, buffer);
        
        // Set the image URL to the relative path (this will be much shorter than the data URL)
        finalImageUrl = `/uploads/events/${filename}`;
        console.log('Saved image to:', filePath);
        console.log('Image URL set to:', finalImageUrl);
      } catch (imageError) {
        console.error('Error saving image:', imageError);
        // Continue with the event update even if image saving fails
      }
    }

    const connection = await getConnection();
    
    // Check if event exists
    const [rows] = await connection.execute(
      'SELECT * FROM events WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Update the event
    // Convert any undefined values to null before passing to the query
    const params = [
      title || null,
      description || null,
      formattedStartDate,
      formattedEndDate,
      location || null,
      organizerName || null,
      organizerEmail || null,  // Using organizerEmail (camelCase) to match the variable name
      eventType || null,
      finalImageUrl || null,  // Using our processed image URL
      id
    ];
    
    console.log('Updating event with params:', params);
    
    try {
      // Remove organizer_email from the query since it doesn't exist in the database
      const updateQuery = `UPDATE events SET
        title = ?, 
        description = ?, 
        startDate = ?, 
        endDate = ?, 
        location = ?, 
        organizerName = ?, 
        eventType = ?, 
        imageUrl = ?
      WHERE id = ?`;
      
      console.log('Update query:', updateQuery);
      
      // Remove organizerEmail from params
      const updatedParams = [
        title || null,
        description || null,
        formattedStartDate,
        formattedEndDate,
        location || null,
        organizerName || null,
        eventType || null,
        finalImageUrl || null,  // Using our processed image URL
        id
      ];
      
      console.log('Updated params:', updatedParams);
      
      await connection.execute(updateQuery, updatedParams);
    } catch (updateError) {
      console.error('Error executing update query:', updateError);
      throw updateError;
    }
    
    connection.release();
    
    // Fetch the updated event from the database to ensure we return the correct data
    const [updatedRows] = await connection.execute(
      'SELECT * FROM events WHERE id = ?',
      [id]
    );
    
    if (updatedRows.length === 0) {
      return res.status(404).json({ message: 'Event not found after update' });
    }
    
    // Transform the database row to match the expected response format
    const updatedEvent = {
      id: parseInt(id),
      title: updatedRows[0].title,
      description: updatedRows[0].description,
      startDate: updatedRows[0].startDate,
      endDate: updatedRows[0].endDate,
      location: updatedRows[0].location,
      organizerName: updatedRows[0].organizerName,
      organizerEmail: updatedRows[0].organizerEmail,
      eventType: updatedRows[0].eventType,
      imageUrl: updatedRows[0].imageUrl,
      source: updatedRows[0].source,
      status: updatedRows[0].status
    };
    
    console.log('Returning updated event:', updatedEvent);
    res.json(updatedEvent);
  } catch (error) {
    console.error('Error in PUT /api/events/:id:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

/**
 * @route DELETE /api/events/:id
 * @desc Delete an event
 * @access Private (Admin only)
 */
router.delete('/:id', async (req, res) => {
  try {
    console.log('DELETE /api/events/:id - Deleting event');
    const { id } = req.params;
    
    const connection = await getConnection();
    
    // Check if event exists
    const [rows] = await connection.execute(
      'SELECT * FROM events WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Delete the event
    await connection.execute(
      'DELETE FROM events WHERE id = ?',
      [id]
    );
    
    connection.release();
    
    console.log('Deleted event:', id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/events/:id:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

/**
 * @route POST /api/events/:id/approve
 * @desc Approve an event
 * @access Private (Admin only)
 */
router.post('/:id/approve', async (req, res) => {
  try {
    console.log('POST /api/events/:id/approve - Approving event');
    const { id } = req.params;
    
    const connection = await getConnection();
    const [result] = await connection.execute(
      'UPDATE events SET status = ? WHERE id = ?', 
      ['approved', id]
    );
    
    if (result.affectedRows === 0) {
      connection.release();
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Fetch the updated event
    const [rows] = await connection.execute('SELECT * FROM events WHERE id = ?', [id]);
    connection.release();
    
    const row = rows[0];
    const event = {
      id: row.id,
      title: row.title,
      description: row.description,
      startDate: row.startDate,
      endDate: row.endDate,
      location: row.location,
      imageUrl: row.imageUrl || '/images/placeholder-event.jpg',
      category: row.eventType,
      source: row.source,
      organizerName: row.organizerName || '',
      organizerEmail: row.organizer_email || '',
      organizerImageUrl: '',
      registrationUrl: row.registration_url || '',
      isFeatured: row.is_featured === 1,
      status: row.status
    };
    
    console.log('Approved event:', event);
    res.json(event);
  } catch (error) {
    console.error('Error in POST /api/events/:id/approve:', error);
    res.status(500).json({ error: 'Failed to approve event' });
  }
});

module.exports = router;