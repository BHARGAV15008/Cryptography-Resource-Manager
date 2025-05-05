import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { FiPlus, FiUpload, FiLink, FiDownload, FiEdit, FiTrash2, FiRefreshCw } from 'react-icons/fi';

const API_BASE_URL = 'http://localhost:5001';

const Lectures = () => {
  const [courses, setCourses] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddLecture, setShowAddLecture] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [newCourse, setNewCourse] = useState({ 
    name: '', 
    description: ''
  });
  const [newLecture, setNewLecture] = useState({
    courseId: '',
    topic: '',
    lectureNo: '',
    date: new Date().toISOString().split('T')[0],
    notes: { type: 'text', content: '' },
    slides_url: ''
  });
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingLecture, setEditingLecture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // DIRECT DATABASE ACCESS - NO MOCK DATA
  const fetchDataFromDatabase = async () => {
    try {
      console.log('Starting fetchDataFromDatabase...');
      setLoading(true);
      setError(null);
      
      // Clear existing data first
      setCourses([]);
      setLectures([]);
      
      console.log('DIRECT DATABASE FETCH: Getting courses from MySQL database...');
      
      // Make a direct database request without any custom headers to avoid CORS issues
      const coursesResponse = await axios.get(`${API_BASE_URL}/api/courses`, {
        params: { timestamp: new Date().getTime() }
      });
      
      console.log('Courses API Response:', coursesResponse);
      console.log('Courses data type:', typeof coursesResponse.data);
      console.log('Courses data:', coursesResponse.data);
      
      console.log('DATABASE RESPONSE (COURSES):', coursesResponse.data);
      
      // Set courses directly from database response
      setCourses(coursesResponse.data);
      
      // Select the first course if available
      if (coursesResponse.data && coursesResponse.data.length > 0) {
        setSelectedCourse(coursesResponse.data[0]);
        
        try {
          // Fetch lectures for the selected course
          console.log('Fetching lectures for course ID:', coursesResponse.data[0].id);
          const lecturesResponse = await axios.get(`${API_BASE_URL}/api/lectures/course/${coursesResponse.data[0].id}`, {
            params: { timestamp: new Date().getTime() }
          });
          
          console.log('Lectures API Response:', lecturesResponse);
          console.log('Lectures data type:', typeof lecturesResponse.data);
          console.log('DATABASE RESPONSE (LECTURES):', lecturesResponse.data);
          
          // Set lectures directly from database response
          setLectures(lecturesResponse.data);
        } catch (lectureErr) {
          console.error('Error fetching lectures:', lectureErr);
          // Don't set an error here, just log it - we still have courses data
          setLectures([]);
        }
      }
    } catch (err) {
      console.error('DATABASE ERROR fetching data:', err);
      // Always set error message when there's an error
      setError('Failed to load data from database: ' + (err.message || 'Unknown error'));
      // Clear courses if we couldn't fetch them
      setCourses([]);
    } finally {
      // Always set loading to false
      setLoading(false);
      
      // Log the final state for debugging
      console.log('Final state after fetch:', { 
        courses: courses.length, 
        lectures: lectures.length, 
        error: error, 
        loading: false 
      });
    }
  };
  
  // Initial data fetch on component mount
  useEffect(() => {
    fetchDataFromDatabase();
  }, []);

  // Helper function to format dates safely
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Unknown';
    }
    
    return date.toLocaleDateString();
  };

  // Function to handle adding a new course to the database
  const handleAddCourse = async () => {
    try {
      setLoading(true);
      
      console.log('Adding new course to database:', newCourse);
      
      const courseData = {
        title: newCourse.name,
        description: newCourse.description,
        code: `CRYPT${Math.floor(Math.random() * 1000)}`,
        professor_name: 'TBD'
      };
      
      if (editingCourse) {
        // Update existing course
        const response = await axios.put(
          `${API_BASE_URL}/api/courses/${editingCourse.id}`,
          courseData,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('Course updated in database:', response.data);
        alert('Course updated successfully in database.');
      } else {
        // Add new course
        const response = await axios.post(
          `${API_BASE_URL}/api/courses`,
          courseData,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('Course added to database:', response.data);
        alert('Course added successfully to database.');
      }
      
      // Refresh data from database
      await fetchDataFromDatabase();
      
      // Reset form and close modal
      setNewCourse({ name: '', description: '' });
      setShowAddCourse(false);
      setEditingCourse(null);
    } catch (err) {
      console.error(`Error ${editingCourse ? 'updating' : 'adding'} course:`, err);
      alert(`Failed to ${editingCourse ? 'update' : 'add'} course to database. Please try again.`);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to handle editing a course
  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setNewCourse({
      name: course.title || course.name,
      description: course.description
    });
    setShowAddCourse(true);
  };
  
  // Function to handle deleting a course from the database
  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course? This will also delete all associated lectures.')) {
      try {
        setLoading(true);
        
        console.log(`Deleting course with ID ${courseId} from database...`);
        
        const response = await axios.delete(`${API_BASE_URL}/api/courses/${courseId}`);
        
        console.log('Course deleted from database:', response.data);
        
        // Refresh data from database
        await fetchDataFromDatabase();
        
        alert('Course deleted successfully from database.');
      } catch (err) {
        console.error('Error deleting course from database:', err);
        alert('Failed to delete course from database. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Function to handle adding a new lecture to the database
  const handleAddLecture = async () => {
    try {
      setLoading(true);
      
      if (!newLecture.topic || !newLecture.courseId) {
        alert('Please fill in all required fields (Topic and Course)');
        setLoading(false);
        return;
      }
      
      // Prepare lecture data for API
      const lectureData = {
        title: newLecture.topic,
        course_id: parseInt(newLecture.courseId),
        lecture_no: newLecture.lectureNo || '1',
        lecture_date: newLecture.date || new Date().toISOString().split('T')[0],
        description: newLecture.notes?.content || 'Lecture notes',
        slides_url: newLecture.slides_url || '',
        // Add fields expected by the server
        category: 'Cryptography',
        instructor: 'TBD',
        videoUrl: '',
        thumbnail: '',
        downloadUrl: '',
        duration: '60 mins'
      };
      
      console.log('Lecture data being sent to API:', lectureData);
      
      if (editingLecture) {
        // Update existing lecture
        console.log(`Updating lecture with ID ${editingLecture.id}:`, lectureData);
        const response = await axios.put(
          `${API_BASE_URL}/api/lectures/${editingLecture.id}`,
          lectureData
        );
        
        console.log('Lecture updated in database:', response.data);
        alert('Lecture updated successfully in database.');
      } else {
        // Add new lecture
        console.log('Adding new lecture:', lectureData);
        const response = await axios.post(
          `${API_BASE_URL}/api/lectures`,
          lectureData
        );
        
        console.log('Lecture added to database response:', response);
        console.log('Lecture added to database data:', response.data);
        alert('Lecture added successfully to database.');
      }
      
      // Refresh data from database
      await fetchDataFromDatabase();
      
      // Reset form and close modal
      setNewLecture({
        courseId: '',
        topic: '',
        lectureNo: '',
        date: new Date().toISOString().split('T')[0],
        notes: { type: 'text', content: '' },
        slides_url: ''
      });
      setShowAddLecture(false);
      setEditingLecture(null);
    } catch (err) {
      console.error(`Error ${editingLecture ? 'updating' : 'adding'} lecture:`, err);
      alert(`Failed to ${editingLecture ? 'update' : 'add'} lecture to database. Please try again.`);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to handle editing a lecture
  const handleEditLecture = (lecture) => {
    console.log('Editing lecture:', lecture);
    setEditingLecture(lecture);
    setNewLecture({
      courseId: (lecture.course_id || lecture.courseId).toString(),
      topic: lecture.title || lecture.topic,
      lectureNo: lecture.lecture_no || lecture.lectureNo || '',
      date: lecture.lecture_date || lecture.date || new Date().toISOString().split('T')[0],
      notes: { 
        type: 'text', 
        content: lecture.description || '' 
      },
      slides_url: lecture.slides_url || ''
    });
    setShowAddLecture(true);
  };
  
  // Function to handle deleting a lecture from the database
  const handleDeleteLecture = async (lectureId) => {
    if (window.confirm('Are you sure you want to delete this lecture?')) {
      try {
        setLoading(true);
        
        console.log(`Deleting lecture with ID ${lectureId} from database...`);
        
        const response = await axios.delete(`${API_BASE_URL}/api/lectures/${lectureId}`);
        
        console.log('Lecture deleted from database:', response.data);
        
        // Refresh data from database
        await fetchDataFromDatabase();
        
        alert('Lecture deleted successfully from database.');
      } catch (err) {
        console.error('Error deleting lecture from database:', err);
        alert('Failed to delete lecture from database. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <DashboardContainer>
      <Header>
        <h1>Lecture Management</h1>
        <RefreshButton onClick={fetchDataFromDatabase} title="Refresh data from database">
          <FiRefreshCw />
          <span>Refresh from Database</span>
        </RefreshButton>
      </Header>
      
      <TabsContainer>
        <Tab>
          <FiBook />
          <span>Courses</span>
        </Tab>
      </TabsContainer>
      
      {error && (
        <ErrorMessage>
          <p><strong>Error:</strong> {error}</p>
          <p>Please try refreshing the page or clicking the "Refresh from Database" button above.</p>
        </ErrorMessage>
      )}
      
      {loading ? (
        <LoadingMessage>Loading data from database...</LoadingMessage>
      ) : (
        <ContentContainer>
          <SectionHeader>
            <h2>Courses</h2>
            <AddButton onClick={() => setShowAddCourse(true)}>
              <FiPlus />
              <span>Add Course</span>
            </AddButton>
          </SectionHeader>
          
          {courses.length === 0 ? (
            <EmptyState>
              <p>No courses found in the database. Add your first course to get started.</p>
            </EmptyState>
          ) : (
            <CoursesGrid>
              {courses.map(course => (
                <CourseCard key={course.id}>
                  <CourseHeader>
                    <h3>{course.title || course.name}</h3>
                    <CourseActions>
                      <ActionButton onClick={() => handleEditCourse(course)} title="Edit course">
                        <FiEdit />
                      </ActionButton>
                      <ActionButton onClick={() => handleDeleteCourse(course.id)} title="Delete course">
                        <FiTrash2 />
                      </ActionButton>
                    </CourseActions>
                  </CourseHeader>
                  <CourseDescription>{course.description || 'No description available'}</CourseDescription>
                  <CourseFooter>
                    <CourseCode>{course.code || 'No code'}</CourseCode>
                    <AddLectureButton 
                      onClick={() => {
                        setNewLecture(prev => ({ ...prev, courseId: course.id }));
                        setShowAddLecture(true);
                      }}
                    >
                      <FiPlus />
                      <span>Add Lecture</span>
                    </AddLectureButton>
                  </CourseFooter>
                  
                  <LecturesList>
                    <h4>Lectures</h4>
                    {lectures.filter(lecture => lecture.course_id === course.id || lecture.courseId === course.id).length === 0 ? (
                      <EmptyState small>
                        <p>No lectures for this course yet.</p>
                      </EmptyState>
                    ) : (
                      lectures
                        .filter(lecture => lecture.course_id === course.id || lecture.courseId === course.id)
                        .map(lecture => (
                          <LectureItem key={lecture.id}>
                            <LectureInfo>
                              <LectureTitle>
                                {(lecture.lecture_no || lecture.lectureNo) && <span>#{lecture.lecture_no || lecture.lectureNo}:</span>} {lecture.title || lecture.topic}
                              </LectureTitle>
                              <LectureDate>{formatDate(lecture.lecture_date || lecture.date)}</LectureDate>
                            </LectureInfo>
                            <LectureActions>
                              {(lecture.slides_url || (lecture.notes && lecture.notes.content)) && (
                                <ActionButton as="a" href={lecture.slides_url || lecture.notes.content} target="_blank" rel="noopener noreferrer" title="View slides">
                                  <FiLink />
                                </ActionButton>
                              )}
                              <ActionButton onClick={() => handleEditLecture(lecture)} title="Edit lecture">
                                <FiEdit />
                              </ActionButton>
                              <ActionButton onClick={() => handleDeleteLecture(lecture.id)} title="Delete lecture">
                                <FiTrash2 />
                              </ActionButton>
                            </LectureActions>
                          </LectureItem>
                        ))
                    )}
                  </LecturesList>
                </CourseCard>
              ))}
            </CoursesGrid>
          )}
        </ContentContainer>
      )}
      
      {showAddCourse && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <h2>{editingCourse ? 'Edit Course' : 'Add New Course'}</h2>
              <CloseButton onClick={() => {
                setShowAddCourse(false);
                setEditingCourse(null);
                setNewCourse({ name: '', description: '' });
              }}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <label htmlFor="courseName">Course Name:</label>
                <input
                  id="courseName"
                  type="text"
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  placeholder="Enter course name"
                  required
                />
              </FormGroup>
              <FormGroup>
                <label htmlFor="courseDescription">Description:</label>
                <textarea
                  id="courseDescription"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  placeholder="Enter course description"
                  rows={4}
                />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <CancelButton onClick={() => {
                setShowAddCourse(false);
                setEditingCourse(null);
                setNewCourse({ name: '', description: '' });
              }}>
                Cancel
              </CancelButton>
              <SubmitButton onClick={handleAddCourse} disabled={!newCourse.name}>
                {editingCourse ? 'Update Course' : 'Add Course'}
              </SubmitButton>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
      
      {showAddLecture && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <h2>{editingLecture ? 'Edit Lecture' : 'Add New Lecture'}</h2>
              <CloseButton onClick={() => {
                setShowAddLecture(false);
                setEditingLecture(null);
                setNewLecture({
                  courseId: '',
                  lectureNo: '',
                  topic: '',
                  date: '',
                  notes: { type: 'url', content: '' }
                });
              }}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <label htmlFor="lectureCourse">Course:</label>
                <select
                  id="lectureCourse"
                  value={newLecture.courseId}
                  onChange={(e) => setNewLecture({ ...newLecture, courseId: e.target.value })}
                  required
                >
                  <option value="">Select a course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.title || course.name}
                    </option>
                  ))}
                </select>
              </FormGroup>
              <FormGroup>
                <label htmlFor="lectureNo">Lecture Number:</label>
                <input
                  id="lectureNo"
                  type="text"
                  value={newLecture.lectureNo}
                  onChange={(e) => setNewLecture({ ...newLecture, lectureNo: e.target.value })}
                  placeholder="e.g., 1, 2, 3"
                />
              </FormGroup>
              <FormGroup>
                <label htmlFor="lectureTopic">Topic:</label>
                <input
                  id="lectureTopic"
                  type="text"
                  value={newLecture.topic}
                  onChange={(e) => setNewLecture({ ...newLecture, topic: e.target.value })}
                  placeholder="Enter lecture topic"
                  required
                />
              </FormGroup>
              <FormGroup>
                <label htmlFor="lectureDate">Date:</label>
                <input
                  id="lectureDate"
                  type="date"
                  value={newLecture.date}
                  onChange={(e) => setNewLecture({ ...newLecture, date: e.target.value })}
                />
              </FormGroup>
              <FormGroup>
                <label htmlFor="slides_url">Slides URL</label>
                <input
                  id="slides_url"
                  type="text"
                  value={newLecture.slides_url}
                  onChange={e => setNewLecture(prev => ({
                    ...prev,
                    slides_url: e.target.value
                  }))}
                  placeholder="Enter URL to slides (e.g., https://example.com/slides.pdf)"
                />
              </FormGroup>
              <FormGroup>
                <label htmlFor="notes">Additional Notes</label>
                <div>
                  <RadioGroup>
                    <RadioOption>
                      <input
                        type="radio"
                        id="notes-text"
                        name="notes-type"
                        checked={newLecture.notes.type === 'text'}
                        onChange={() => setNewLecture(prev => ({
                          ...prev,
                          notes: { ...prev.notes, type: 'text' }
                        }))}
                      />
                      <label htmlFor="notes-text">Text Notes</label>
                    </RadioOption>
                    <RadioOption>
                      <input
                        type="radio"
                        id="notes-url"
                        name="notes-type"
                        checked={newLecture.notes.type === 'url'}
                        onChange={() => setNewLecture(prev => ({
                          ...prev,
                          notes: { ...prev.notes, type: 'url' }
                        }))}
                      />
                      <label htmlFor="notes-url">Notes URL</label>
                    </RadioOption>
                  </RadioGroup>
                </div>
                {newLecture.notes.type === 'text' ? (
                  <textarea
                    id="notes-content"
                    value={newLecture.notes.content}
                    onChange={e => setNewLecture(prev => ({
                      ...prev,
                      notes: { ...prev.notes, content: e.target.value }
                    }))}
                    placeholder="Enter additional lecture notes..."
                  />
                ) : (
                  <input
                    type="text"
                    id="notes-content"
                    value={newLecture.notes.content}
                    onChange={e => setNewLecture(prev => ({
                      ...prev,
                      notes: { ...prev.notes, content: e.target.value }
                    }))}
                    placeholder="Enter URL to additional notes..."
                  />
                )}
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <CancelButton onClick={() => {
                setShowAddLecture(false);
                setEditingLecture(null);
                setNewLecture({
                  courseId: '',
                  lectureNo: '',
                  topic: '',
                  date: '',
                  notes: { type: 'url', content: '' }
                });
              }}>
                Cancel
              </CancelButton>
              <SubmitButton 
                onClick={handleAddLecture} 
                disabled={!newLecture.topic || !newLecture.courseId}
              >
                {editingLecture ? 'Update Lecture' : 'Add Lecture'}
              </SubmitButton>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </DashboardContainer>
  );
};

// Styled Components
const DashboardContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  h1 {
    margin: 0;
    color: #333;
  }
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #e0e0e0;
  }
  
  svg {
    font-size: 1rem;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: 2rem;
  border-bottom: 1px solid #ddd;
`;

const Tab = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-bottom: 2px solid #4a90e2;
  color: #4a90e2;
  font-weight: 500;
  
  svg {
    font-size: 1.2rem;
  }
`;

const ContentContainer = styled.div`
  margin-top: 2rem;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  
  h2 {
    margin: 0;
    color: #333;
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #3a80d2;
  }
  
  svg {
    font-size: 1rem;
  }
`;

const CoursesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
`;

const CourseCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const CourseHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #eee;
  
  h3 {
    margin: 0;
    color: #333;
    font-size: 1.2rem;
  }
`;

const CourseActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover {
    color: #4a90e2;
    background-color: rgba(74, 144, 226, 0.1);
  }
  
  svg {
    font-size: 1rem;
  }
`;

const CourseDescription = styled.p`
  padding: 1rem 1.5rem;
  color: #666;
  margin: 0;
  font-size: 0.9rem;
`;

const CourseFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
`;

const CourseCode = styled.span`
  font-size: 0.8rem;
  color: #888;
  background-color: #f0f0f0;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
`;

const AddLectureButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: 1px solid #4a90e2;
  color: #4a90e2;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(74, 144, 226, 0.1);
  }
  
  svg {
    font-size: 0.8rem;
  }
`;

const LecturesList = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
  
  h4 {
    margin: 0 0 1rem 0;
    color: #333;
    font-size: 1rem;
  }
`;

const LectureItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const LectureInfo = styled.div`
  flex: 1;
`;

const LectureTitle = styled.div`
  font-weight: 500;
  color: #333;
  margin-bottom: 0.25rem;
  
  span {
    color: #888;
    font-weight: normal;
    margin-right: 0.25rem;
  }
`;

const LectureDate = styled.div`
  font-size: 0.8rem;
  color: #888;
`;

const LectureActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
  
  h2 {
    margin: 0;
    color: #333;
    font-size: 1.5rem;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #888;
  cursor: pointer;
  
  &:hover {
    color: #333;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
  
  input, select, textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  textarea {
    min-height: 100px;
    resize: vertical;
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #eee;
`;

const CancelButton = styled.button`
  background-color: #f0f0f0;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #e0e0e0;
  }
`;

const SubmitButton = styled.button`
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #3a80d2;
  }
  
  &:disabled {
    background-color: #a0c0e8;
    cursor: not-allowed;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
`;

const ErrorMessage = styled.div`
  background-color: #fff0f0;
  border: 1px solid #ffcccc;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 2rem;
  color: #cc0000;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${props => props.small ? '1rem' : '3rem'};
  color: #888;
  
  p {
    margin: 0 0 1rem 0;
  }
`;

const FiBook = styled(FiPlus)`
  /* This is just a placeholder to make the component compile */
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
`;

const RadioOption = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  input[type="radio"] {
    width: auto;
  }
`;

export default Lectures;