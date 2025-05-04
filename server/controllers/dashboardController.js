const { executeQuery } = require('../config/db');
const asyncHandler = require('express-async-handler');

// @desc    Get dashboard summary statistics
// @route   GET /api/dashboard/summary
// @access  Private/Admin
const getDashboardSummary = asyncHandler(async (req, res) => {
  try {
    // Get user counts
    const userStats = await executeQuery(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin,
        SUM(CASE WHEN role = 'authorised' THEN 1 ELSE 0 END) as authorised,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as user
      FROM users
    `);

    // Get recent activities
    const recentActivities = await executeQuery(`
      SELECT 
        al.id, 
        al.action, 
        al.resource_type, 
        al.resource_id, 
        al.description, 
        al.created_at,
        u.name as actor_name,
        u.id as actor_id
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 10
    `);

    // Get today's visitor stats
    const todayVisitors = await executeQuery(`
      SELECT 
        SUM(page_views) as total,
        SUM(unique_visitors) as unique,
        AVG(avg_session_duration) as avg_time
      FROM visitor_analytics
      WHERE date = CURDATE()
    `);

    // Get visitor stats for the last 30 days
    const visitorHistory = await executeQuery(`
      SELECT 
        date,
        page_views as count,
        unique_visitors as unique_count
      FROM visitor_analytics
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      ORDER BY date ASC
    `);

    // Get resource counts by type
    const resourceByType = await executeQuery(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN type = 'video' THEN 1 ELSE 0 END) as videos,
        SUM(CASE WHEN type = 'note' THEN 1 ELSE 0 END) as notes,
        SUM(CASE WHEN type = 'book' THEN 1 ELSE 0 END) as books,
        SUM(CASE WHEN type = 'citation' THEN 1 ELSE 0 END) as citations,
        COUNT(DISTINCT created_by) as unique_contributors
      FROM resources
    `);

    // Get event counts
    const eventStats = await executeQuery(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN startDate > NOW() THEN 1 ELSE 0 END) as upcoming,
        SUM(CASE WHEN DATE(startDate) = CURDATE() THEN 1 ELSE 0 END) as today
      FROM events
    `);

    // Get monthly statistics for resources, users, and events (last 6 months)
    const monthlyStats = await executeQuery(`
      SELECT 
        DATE_FORMAT(m.month, '%b %Y') as month,
        COALESCE(r.resources_added, 0) as resources_added,
        COALESCE(u.new_users, 0) as new_users,
        COALESCE(e.events, 0) as events
      FROM (
        SELECT LAST_DAY(DATE_SUB(CURDATE(), INTERVAL n MONTH)) as month
        FROM (
          SELECT 0 as n UNION SELECT 1 UNION SELECT 2 
          UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
        ) months
      ) m
      LEFT JOIN (
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          COUNT(*) as resources_added
        FROM resources
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ) r ON DATE_FORMAT(m.month, '%Y-%m') = r.month
      LEFT JOIN (
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          COUNT(*) as new_users
        FROM users
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ) u ON DATE_FORMAT(m.month, '%Y-%m') = u.month
      LEFT JOIN (
        SELECT 
          DATE_FORMAT(startDate, '%Y-%m') as month,
          COUNT(*) as events
        FROM events
        WHERE startDate >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(startDate, '%Y-%m')
      ) e ON DATE_FORMAT(m.month, '%Y-%m') = e.month
      ORDER BY m.month ASC
    `);

    // Get previous period stats for growth calculations
    const previousPeriodStats = await executeQuery(`
      SELECT
        (SELECT COUNT(*) FROM resources WHERE created_at BETWEEN DATE_SUB(CURDATE(), INTERVAL 60 DAY) AND DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as resources,
        (SELECT COUNT(*) FROM users WHERE created_at BETWEEN DATE_SUB(CURDATE(), INTERVAL 60 DAY) AND DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as users
    `);

    // Get pending tasks
    const pendingTasks = await executeQuery(`
      SELECT 
        'Approve pending events' as title,
        CONCAT('There are ', COUNT(*), ' events waiting for approval') as description,
        CASE 
          WHEN COUNT(*) > 5 THEN 'high'
          WHEN COUNT(*) > 2 THEN 'medium'
          ELSE 'low'
        END as priority,
        'pending' as status,
        DATE_ADD(CURDATE(), INTERVAL 3 DAY) as due_date
      FROM events 
      WHERE status = 'pending'
      
      UNION ALL
      
      SELECT 
        'Review user permissions' as title,
        'Monthly permission review required' as description,
        'medium' as priority,
        'pending' as status,
        LAST_DAY(CURDATE()) as due_date
      
      UNION ALL
      
      SELECT 
        'Update resource metadata' as title,
        'Check and complete missing metadata for recent resources' as description,
        'low' as priority,
        'in_progress' as status,
        DATE_ADD(CURDATE(), INTERVAL 7 DAY) as due_date
    `);

    res.json({
      userStats: userStats[0] || { total: 0, admin: 0, authorised: 0, user: 0 },
      todayVisitors: todayVisitors[0] || { total: 0, unique: 0, avg_time: '0m' },
      visitorHistory: visitorHistory || [],
      resourceStats: resourceByType[0] || { total: 0, videos: 0, notes: 0, books: 0, citations: 0, unique_contributors: 0 },
      eventStats: eventStats[0] || { total: 0, upcoming: 0, today: 0 },
      recentActivities: recentActivities || [],
      monthlyStats: monthlyStats || [],
      previousPeriodStats: previousPeriodStats[0] || { resources: 0, users: 0 },
      pendingTasks: pendingTasks || []
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ message: 'Server error loading dashboard data', error: error.message });
  }
});

// @desc    Get user activity metrics
// @route   GET /api/dashboard/activity
// @access  Private/Admin
const getActivityStats = asyncHandler(async (req, res) => {
  try {
    const { days = 7 } = req.query;

    // Get activity by day
    const activityByDay = await executeQuery(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        action as action_type
      FROM activity_logs
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at), action
      ORDER BY date ASC
    `, [days]);

    // Get activity by user
    const activityByUser = await executeQuery(`
      SELECT 
        u.name,
        u.email,
        COUNT(al.id) as activity_count
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      WHERE al.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY al.user_id
      ORDER BY activity_count DESC
      LIMIT 10
    `, [days]);

    // Get activity by entity type
    const activityByType = await executeQuery(`
      SELECT 
        resource_type as entity_type,
        COUNT(*) as count
      FROM activity_logs
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY resource_type
      ORDER BY count DESC
    `, [days]);

    res.json({
      activityByDay,
      activityByUser,
      activityByType
    });
  } catch (error) {
    console.error('Activity stats error:', error);
    res.status(500).json({ message: 'Server error loading activity data', error: error.message });
  }
});

// @desc    Get visitor analytics
// @route   GET /api/dashboard/visitors
// @access  Private/Admin
const getVisitorStats = asyncHandler(async (req, res) => {
  try {
    const { days = 30 } = req.query;

    // Daily visitors
    const dailyVisitors = await executeQuery(`
      SELECT 
        date,
        page_views,
        unique_visitors,
        new_visitors,
        returning_visitors,
        avg_session_duration,
        bounce_rate
      FROM visitor_analytics
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY date ASC
    `, [days]);

    // Overall metrics
    const overallMetrics = await executeQuery(`
      SELECT 
        SUM(page_views) as total_page_views,
        SUM(unique_visitors) as total_unique_visitors,
        SUM(new_visitors) as total_new_visitors,
        AVG(avg_session_duration) as avg_session_duration,
        AVG(bounce_rate) as avg_bounce_rate
      FROM visitor_analytics
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `, [days]);

    res.json({
      dailyVisitors,
      overallMetrics: overallMetrics[0]
    });
  } catch (error) {
    console.error('Visitor stats error:', error);
    res.status(500).json({ message: 'Server error loading visitor data', error: error.message });
  }
});

// @desc    Record a page view
// @route   POST /api/dashboard/pageview
// @access  Public
const recordPageView = asyncHandler(async (req, res) => {
  try {
    const { page_url, user_id } = req.body;
    const ip_address = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const user_agent = req.headers['user-agent'] || 'unknown';
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Check if we have a record for today
    const existingRecord = await executeQuery(
      `SELECT id FROM visitor_analytics WHERE date = ?`, 
      [today]
    );
    
    if (existingRecord.length > 0) {
      // Update existing record
      await executeQuery(
        `UPDATE visitor_analytics 
         SET page_views = page_views + 1,
             unique_visitors = unique_visitors + CASE WHEN ? NOT IN (
               SELECT DISTINCT ip_address 
               FROM activity_logs 
               WHERE DATE(created_at) = ? AND ip_address IS NOT NULL
             ) THEN 1 ELSE 0 END
         WHERE date = ?`,
        [ip_address, today, today]
      );
    } else {
      // Create new record for today
      await executeQuery(
        `INSERT INTO visitor_analytics 
         (date, page_views, unique_visitors, new_visitors, returning_visitors) 
         VALUES (?, 1, 1, 1, 0)`,
        [today]
      );
    }
    
    // Log this activity
    if (user_id) {
      await executeQuery(
        `INSERT INTO activity_logs
         (user_id, action, resource_type, description, ip_address, user_agent)
         VALUES (?, 'VIEW', 'PAGE', ?, ?, ?)`,
        [user_id, page_url, ip_address, user_agent]
      );
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Page view recording error:', error);
    res.status(500).json({ message: 'Server error recording page view', error: error.message });
  }
});

// @desc    Get content stats
// @route   GET /api/dashboard/content
// @access  Private/Admin
const getContentStats = asyncHandler(async (req, res) => {
  try {
    // Get resource stats by type
    const resourcesByType = await executeQuery(`
      SELECT 
        type,
        COUNT(*) as count
      FROM resources
      GROUP BY type
    `);

    // Get resources by user
    const resourcesByUser = await executeQuery(`
      SELECT 
        u.name,
        COUNT(r.id) as count
      FROM resources r
      JOIN users u ON r.created_by = u.id
      GROUP BY r.created_by
      ORDER BY count DESC
      LIMIT 10
    `);

    // Get resources by month (last 12 months)
    const resourcesByMonth = await executeQuery(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count
      FROM resources
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `);

    // Get event stats by month
    const eventsByMonth = await executeQuery(`
      SELECT 
        DATE_FORMAT(startDate, '%Y-%m') as month,
        COUNT(*) as count
      FROM events
      WHERE startDate >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(startDate, '%Y-%m')
      ORDER BY month ASC
    `);

    // Get lecture stats
    const lectureStats = await executeQuery(`
      SELECT 
        category,
        COUNT(*) as count,
        SUM(duration) as total_duration
      FROM lectures
      GROUP BY category
    `);

    res.json({
      resourcesByType,
      resourcesByUser,
      resourcesByMonth,
      eventsByMonth,
      lectureStats
    });
  } catch (error) {
    console.error('Content stats error:', error);
    res.status(500).json({ message: 'Server error loading content stats', error: error.message });
  }
});

module.exports = {
  getDashboardSummary,
  getActivityStats,
  getVisitorStats,
  recordPageView,
  getContentStats
};