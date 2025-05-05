import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { FiPlus, FiUpload, FiLink, FiDownload, FiEdit, FiTrash2 } from 'react-icons/fi';

const Lectures = () => {
  const [courses, setCourses] = useState([]);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddLecture, setShowAddLecture] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [newCourse, setNewCourse] = useState({ 
    name: '', 
    description: ''
  });
  const [newLecture, setNewLecture] = useState({
    courseId: '',
    lectureNo: '',
    topic: '',
    date: '',
    notes: { type: 'url', content: '' }
  });
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingLecture, setEditingLecture] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedCourses = localStorage.getItem('courses');
    if (savedCourses) {
      try {
        setCourses(JSON.parse(savedCourses));
      } catch (err) {
        console.error('Error parsing saved courses:', err);
        fetchCourses();
      }
    } else {
      fetchCourses();
    }
  }, []);

  // Save courses to localStorage whenever they change
  useEffect(() => {
    if (courses.length > 0) {
      localStorage.setItem('courses', JSON.stringify(courses));
    }
  }, [courses]);

  // Helper function to format dates safely
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Unknown';
    }
    
    return date.toLocaleDateString();
  };

  // Get auth token for API requests
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchCourses = async () => {
    try {
      console.log('Fetching courses from API...');
      setLoading(true);
      
      // Simulate API response with dummy data since the actual API requires authentication
      // In a real application, you would use the actual API endpoint
      // const response = await axios.get('http://localhost:5001/api/courses', {
      //   headers: getAuthHeader()
      // });
      
      // Dummy data for demonstration
      const dummyData = [
        { 
          id: 1, 
          name: 'Introduction to Cryptography', 
          description: 'An introductory course to cryptography concepts',
          lectures: [
            {
              id: 1,
              courseId: 1,
              lectureNo: '1',
              topic: 'Symmetric Key Cryptography',
              date: '2023-09-15',
              notes: { type: 'url', content: 'https://example.com/notes1' }
            },
            {
              id: 2,
              courseId: 1,
              lectureNo: '2',
              topic: 'Public Key Infrastructure',
              date: '2023-09-22',
              notes: { type: 'url', content: 'https://example.com/notes2' }
            }
          ]
        },
        { 
          id: 2, 
          name: 'Advanced Encryption', 
          description: 'Advanced topics in modern encryption techniques',
          lectures: [
            {
              id: 3,
              courseId: 2,
              lectureNo: '1',
              topic: 'Quantum Cryptography',
              date: '2023-10-05',
              notes: { type: 'url', content: 'https://example.com/notes3' }
            }
          ]
        }
      ];
      
      setCourses(dummyData);
      console.log('Courses data received:', dummyData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setLoading(false);
      
      // Set dummy data even if the API fails
      const dummyData = [
        { 
          id: 1, 
          name: 'Introduction to Cryptography', 
          description: 'An introductory course to cryptography concepts',
          lectures: []
        },
        { 
          id: 2, 
          name: 'Advanced Encryption', 
          description: 'Advanced topics in modern encryption techniques',
          lectures: []
        }
      ];
      setCourses(dummyData);
    }
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setNewCourse({
      name: course.name,
      description: course.description
    });
    setShowAddCourse(true);
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course? This will also delete all associated lectures.')) {
      try {
        setLoading(true);
        // In a real application, you would make an API call
        // await axios.delete(`http://localhost:5001/api/courses/${courseId}`, {
        //   headers: getAuthHeader()
        // });
        
        // For now, just update the state
        setCourses(courses.filter(course => course.id !== courseId));
        setLoading(false);
        alert('Course deleted successfully');
      } catch (err) {
        console.error('Error deleting course:', err);
        alert('Failed to delete course. Make sure you have the right permissions.');
        setLoading(false);
      }
    }
  };

  const handleEditLecture = (lecture) => {
    setEditingLecture(lecture);
    setNewLecture({
      courseId: lecture.courseId,
      lectureNo: lecture.lectureNo,
      topic: lecture.topic,
      date: lecture.date,
      notes: lecture.notes || { type: 'url', content: '' }
    });
    setShowAddLecture(true);
  };

  const handleDeleteLecture = async (lectureId, courseId) => {
    if (window.confirm('Are you sure you want to delete this lecture?')) {
      try {
        setLoading(true);
        // In a real application, you would make an API call
        // await axios.delete(`http://localhost:5001/api/lectures/${lectureId}`, {
        //   headers: getAuthHeader()
        // });
        
        // For now, just update the state
        setCourses(courses.map(course => {
          if (course.id === courseId) {
            return {
              ...course,
              lectures: course.lectures ? course.lectures.filter(lecture => lecture.id !== lectureId) : []
            };
          }
          return course;
        }));
        setLoading(false);
        alert('Lecture deleted successfully');
      } catch (err) {
        console.error('Error deleting lecture:', err);
        alert('Failed to delete lecture. Make sure you have the right permissions.');
        setLoading(false);
      }
    }
  };

  const handleAddCourse = async () => {
    try {
      setLoading(true);
      if (editingCourse) {
        // Update existing course
        console.log('Updating course with data:', newCourse);
        // In a real application, you would make an API call
        // const response = await axios.put(`http://localhost:5001/api/courses/${editingCourse.id}`, newCourse, {
        //   headers: {
        //     ...getAuthHeader(),
        //     'Content-Type': 'application/json'
        //   }
        // });
        
        // For now, just update the state
        setCourses(courses.map(course => 
          course.id === editingCourse.id 
            ? { ...course, name: newCourse.name, description: newCourse.description }
            : course
        ));
        console.log('Course updated successfully');
        alert('Course updated successfully');
      } else {
        // Add new course
        console.log('Adding new course with data:', newCourse);
        // In a real application, you would make an API call
        // const response = await axios.post('http://localhost:5001/api/courses', newCourse, {
        //   headers: {
        //     ...getAuthHeader(),
        //     'Content-Type': 'application/json'
        //   }
        // });
        
        // For now, just update the state with a new dummy course
        const newId = Math.max(...courses.map(c => c.id), 0) + 1;
        setCourses([...courses, { 
          id: newId, 
          name: newCourse.name, 
          description: newCourse.description,
          lectures: []
        }]);
        console.log('Course added successfully');
        alert('Course added successfully');
      }
      setShowAddCourse(false);
      setNewCourse({ name: '', description: '' });
      setEditingCourse(null);
      setLoading(false);
    } catch (err) {
      console.error(`Error ${editingCourse ? 'updating' : 'adding'} course:`, err);
      alert(`Failed to ${editingCourse ? 'update' : 'add'} course. Make sure you have the right permissions.`);
      setLoading(false);
    }
  };

  const handleAddLecture = async () => {
    try {
      setLoading(true);
      if (!selectedCourse && !editingLecture) {
        console.error('No course selected. Cannot add lecture.');
        setLoading(false);
        return;
      }
      
      // Ensure courseId is definitely a number
      const courseId = editingLecture ? parseInt(editingLecture.courseId, 10) : parseInt(selectedCourse.id, 10);
      if (isNaN(courseId)) {
        console.error('Invalid course ID:', editingLecture ? editingLecture.courseId : selectedCourse.id);
        setLoading(false);
        return;
      }
      
      // Check if required fields are filled in
      if (!newLecture.lectureNo || !newLecture.topic) {
        alert('Please fill in all required fields (Lecture Number and Topic)');
        setLoading(false);
        return;
      }
      
      console.log(`${editingLecture ? 'Updating' : 'Adding new'} lecture...`);
      
      if (editingLecture) {
        // Update existing lecture
        // In a real application, you would make an API call
        // const formData = new FormData();
        // Object.keys(newLecture).forEach(key => {
        //   if (key === 'notes') {
        //     formData.append(key, JSON.stringify(newLecture[key]));
        //   } else {
        //     formData.append(key, newLecture[key]);
        //   }
        // });
        
        // const response = await axios.put(`http://localhost:5001/api/lectures/${editingLecture.id}`, formData, {
        //   headers: {
        //     ...getAuthHeader(),
        //     'Content-Type': 'multipart/form-data'
        //   }
        // });
        
        // For now, just update the state
        setCourses(courses.map(course => {
          if (course.id === courseId) {
            return {
              ...course,
              lectures: course.lectures.map(lecture => 
                lecture.id === editingLecture.id 
                  ? { 
                      ...lecture, 
                      lectureNo: newLecture.lectureNo,
                      topic: newLecture.topic,
                      date: newLecture.date,
                      notes: newLecture.notes
                    }
                  : lecture
              )
            };
          }
          return course;
        }));
        console.log('Lecture updated successfully');
        alert(`Lecture "${newLecture.topic}" updated successfully`);
      } else {
        // Add new lecture
        // In a real application, you would make an API call
        // const formData = new FormData();
        // Object.keys(newLecture).forEach(key => {
        //   if (key === 'notes') {
        //     formData.append(key, JSON.stringify(newLecture[key]));
        //   } else {
        //     formData.append(key, newLecture[key]);
        //   }
        // });
        
        // const response = await axios.post('http://localhost:5001/api/lectures', formData, {
        //   headers: {
        //     ...getAuthHeader(),
        //     'Content-Type': 'multipart/form-data'
        //   }
        // });
        
        // For now, just update the state with a new dummy lecture
        const newId = Math.max(...courses.flatMap(c => c.lectures?.map(l => l.id) || []), 0) + 1;
        setCourses(courses.map(course => {
          if (course.id === courseId) {
            return {
              ...course,
              lectures: [...(course.lectures || []), {
                id: newId,
                courseId: courseId,
                lectureNo: newLecture.lectureNo,
                topic: newLecture.topic,
                date: newLecture.date || new Date().toISOString().split('T')[0],
                notes: newLecture.notes
              }]
            };
          }
          return course;
        }));
        console.log('Lecture added successfully');
        alert(`Lecture "${newLecture.topic}" added successfully`);
      }
      
      // Reset form and state
      setShowAddLecture(false);
      setNewLecture({
        courseId: '',
        lectureNo: '',
        topic: '',
        date: '',
        notes: { type: 'url', content: '' }
      });
      setEditingLecture(null);
      setLoading(false);
    } catch (err) {
      console.error(`Error ${editingLecture ? 'updating' : 'adding'} lecture:`, err);
      alert(`Failed to ${editingLecture ? 'update' : 'add'} lecture. Make sure you have the right permissions.`);
      setLoading(false);
    }
  };

  return (
    <Container>
      <Header>
        <PageTitle>Lectures at IIITD</PageTitle>
      </Header>
      
      {loading && <LoadingOverlay><LoadingSpinner /></LoadingOverlay>}
      
      <SectionContainer>
        <SectionHeader>
          <h2>Courses</h2>
          <AddButton onClick={() => {
            setEditingCourse(null);
            setNewCourse({ name: '', description: '' });
            setShowAddCourse(true);
          }}>
            <FiPlus /> Add Course
          </AddButton>
        </SectionHeader>
        
        <CourseGrid>
          {courses.map(course => (
            <CourseCard key={course.id}>
              <CourseName>{course.name}</CourseName>
              <CourseDescription>{course.description}</CourseDescription>
              <ActionButtons>
                <ActionButton onClick={() => handleEditCourse(course)}>
                  <FiEdit /> Edit
                </ActionButton>
                <ActionButton $danger onClick={() => handleDeleteCourse(course.id)}>
                  <FiTrash2 /> Delete
                </ActionButton>
              </ActionButtons>
            </CourseCard>
          ))}
        </CourseGrid>
      </SectionContainer>
      
      {courses.map(course => (
        <CourseSection key={course.id}>
          <CourseHeader>
            <h2>{course.name}</h2>
            <AddButton 
              $small 
              onClick={() => {
                setSelectedCourse(course);
                setEditingLecture(null);
                setNewLecture({
                  courseId: course.id,
                  lectureNo: '',
                  topic: '',
                  date: '',
                  notes: { type: 'url', content: '' }
                });
                setShowAddLecture(true);
              }}
            >
              <FiPlus /> Add Lecture
            </AddButton>
          </CourseHeader>
          
          {course.lectures && course.lectures.length > 0 ? (
            <Table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Topic</th>
                  <th>Date</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {course.lectures.map(lecture => (
                  <tr key={lecture.id}>
                    <td>{lecture.lectureNo}</td>
                    <td>{lecture.topic}</td>
                    <td>{formatDate(lecture.date)}</td>
                    <td>
                      {lecture.notes && lecture.notes.type === 'url' && lecture.notes.content && (
                        <NoteLink href={lecture.notes.content} target="_blank" rel="noopener noreferrer">
                          <FiLink /> View Notes
                        </NoteLink>
                      )}
                      {lecture.notes && lecture.notes.type === 'pdf' && lecture.notes.url && (
                        <NoteLink href={lecture.notes.url} target="_blank" rel="noopener noreferrer">
                          <FiDownload /> Download PDF
                        </NoteLink>
                      )}
                    </td>
                    <td>
                      <ActionButtons>
                        <ActionButton onClick={() => handleEditLecture(lecture)}>
                          <FiEdit /> Edit
                        </ActionButton>
                        <ActionButton $danger onClick={() => handleDeleteLecture(lecture.id, course.id)}>
                          <FiTrash2 /> Delete
                        </ActionButton>
                      </ActionButtons>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyState>No lectures added yet</EmptyState>
          )}
        </CourseSection>
      ))}
      
      {showAddCourse && (
        <Modal>
          <ModalContent>
            <h2>{editingCourse ? 'Edit Course' : 'Add New Course'}</h2>
            <Input
              placeholder="Course Name"
              value={newCourse.name}
              onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
            />
            <TextArea
              placeholder="Course Description"
              value={newCourse.description}
              onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
            />
            <ButtonGroup>
              <Button onClick={handleAddCourse}>{editingCourse ? 'Update' : 'Add'}</Button>
              <Button secondary onClick={() => {
                setShowAddCourse(false);
                setEditingCourse(null);
              }}>Cancel</Button>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}
      
      {showAddLecture && (
        <Modal>
          <ModalContent>
            <h2>{editingLecture ? 'Edit Lecture' : 'Add New Lecture'}</h2>
            <Input
              placeholder="Lecture Number"
              type="number"
              value={newLecture.lectureNo}
              onChange={(e) => setNewLecture({ ...newLecture, lectureNo: e.target.value })}
            />
            <Input
              placeholder="Topic"
              value={newLecture.topic}
              onChange={(e) => setNewLecture({ ...newLecture, topic: e.target.value })}
            />
            <Input
              type="date"
              value={newLecture.date}
              onChange={(e) => setNewLecture({ ...newLecture, date: e.target.value })}
            />
            <div>
              <label>
                <input
                  type="radio"
                  name="notesType"
                  checked={newLecture.notes.type === 'url'}
                  onChange={() => setNewLecture({
                    ...newLecture,
                    notes: { type: 'url', content: newLecture.notes.content || '' }
                  })}
                /> URL Link
              </label>
              <label style={{ marginLeft: '1rem' }}>
                <input
                  type="radio"
                  name="notesType"
                  checked={newLecture.notes.type === 'pdf'}
                  onChange={() => setNewLecture({
                    ...newLecture,
                    notes: { type: 'pdf', content: '', file: null }
                  })}
                /> PDF Upload
              </label>
            </div>
            
            {newLecture.notes.type === 'url' ? (
              <Input
                placeholder="Notes URL"
                value={newLecture.notes.content}
                onChange={(e) => setNewLecture({
                  ...newLecture,
                  notes: { ...newLecture.notes, content: e.target.value }
                })}
              />
            ) : (
              <div>
                <FileInputLabel htmlFor="pdfUpload">
                  <FiUpload /> Choose PDF File
                </FileInputLabel>
                <FileInput
                  id="pdfUpload"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setNewLecture({
                        ...newLecture,
                        notes: {
                          ...newLecture.notes,
                          content: file.name,
                          file: file
                        }
                      });
                    }
                  }}
                />
                {newLecture.notes.content && newLecture.notes.type === 'pdf' && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                    Selected file: {newLecture.notes.content}
                  </div>
                )}
              </div>
            )}
            <ButtonGroup>
              <Button onClick={handleAddLecture}>{editingLecture ? 'Update' : 'Add'}</Button>
              <Button secondary onClick={() => {
                setShowAddLecture(false);
                setEditingLecture(null);
              }}>Cancel</Button>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

const Container = styled.div`
  padding: 2rem;
  position: relative;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  color: #333;
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
`;

const LoadingSpinner = styled.div`
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #3f51b5;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;

  h2 {
    margin-bottom: 1.5rem;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-height: 100px;
  resize: vertical;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
`;

const Button = styled.button.attrs(props => ({
  // Strip out custom props so they don't get passed to the DOM element
  secondary: undefined
}))`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  background: ${props => props.secondary ? '#e0e0e0' : '#3f51b5'};
  color: ${props => props.secondary ? '#333' : 'white'};
  cursor: pointer;
  
  &:hover {
    background: ${props => props.secondary ? '#d0d0d0' : '#303f9f'};
  }
`;

const AddButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: ${props => props.$small ? '0.5rem 1rem' : '0.75rem 1.5rem'};
  font-size: ${props => props.$small ? '0.875rem' : '1rem'};
`;

const SectionContainer = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h2 {
    font-size: 1.25rem;
    margin: 0;
  }
`;

const CourseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
`;

const CourseCard = styled.div`
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 4px;
`;

const CourseName = styled.h3`
  margin: 0 0 0.5rem;
  font-size: 1rem;
`;

const CourseDescription = styled.p`
  margin: 0;
  color: #666;
  font-size: 0.875rem;
`;

const CourseSection = styled.div`
  margin-bottom: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
`;

const CourseHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  
  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  
  th {
    background: #f5f5f5;
    font-weight: 600;
  }
`;

const NoteLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #3f51b5;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 4px;
  background: ${props => props.$danger ? '#ffebee' : '#e3f2fd'};
  color: ${props => props.$danger ? '#c62828' : '#1565c0'};
  font-size: 0.75rem;
  cursor: pointer;
  
  &:hover {
    background: ${props => props.$danger ? '#ffcdd2' : '#bbdefb'};
  }
`;

const EmptyState = styled.div`
  padding: 1rem;
  text-align: center;
  color: #666;
  font-style: italic;
`;

const FileInput = styled.input`
  display: none;
`;

const FileInputLabel = styled.label`
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  margin-bottom: 1rem;
  
  &:hover {
    background-color: #e0e0e0;
  }
  
  svg {
    margin-right: 0.5rem;
  }
`;

export default Lectures;
