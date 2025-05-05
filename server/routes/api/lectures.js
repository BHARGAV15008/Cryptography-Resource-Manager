const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const admin = require('../../middleware/admin');
const Lecture = require('../../models/Lecture');

// @route   GET api/lectures
// @desc    Get all lectures
// @access  Public
router.get('/', async (req, res) => {
  try {
    const lectures = await Lecture.find().sort({ createdAt: -1 });
    res.json(lectures);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/lectures/:id
// @desc    Get lecture by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);
    
    if (!lecture) {
      return res.status(404).json({ msg: 'Lecture not found' });
    }
    
    res.json(lecture);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Lecture not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/lectures
// @desc    Create a lecture
// @access  Public (No authentication required)
router.post('/', async (req, res) => {
  const { 
    title, 
    description, 
    category, 
    instructor, 
    videoUrl, 
    thumbnail, 
    downloadUrl,
    duration 
  } = req.body;
  
  try {
    const newLecture = new Lecture({
      title,
      description,
      category,
      instructor,
      videoUrl,
      thumbnail,
      downloadUrl,
      duration,
      // Remove createdBy field since we don't have authentication
      course_id: req.body.course_id,
      lecture_no: req.body.lecture_no,
      lecture_date: req.body.lecture_date,
      slides_url: req.body.slides_url
    });
    
    const lecture = await newLecture.save();
    res.json(lecture);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/lectures/:id
// @desc    Update a lecture
// @access  Public (No authentication required)
router.put('/:id', async (req, res) => {
  try {
    let lecture = await Lecture.findById(req.params.id);
    
    if (!lecture) {
      return res.status(404).json({ msg: 'Lecture not found' });
    }
    
    lecture = await Lecture.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    
    res.json(lecture);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Lecture not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/lectures/:id
// @desc    Delete a lecture
// @access  Public (No authentication required)
router.delete('/:id', async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);
    
    if (!lecture) {
      return res.status(404).json({ msg: 'Lecture not found' });
    }
    
    await lecture.remove();
    res.json({ msg: 'Lecture removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Lecture not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;