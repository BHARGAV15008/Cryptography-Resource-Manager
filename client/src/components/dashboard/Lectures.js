import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { FiPlus, FiUpload, FiLink, FiDownload } from 'react-icons/fi';

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

  useEffect(() => {
    fetchCourses();
  }, []);

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

  const fetchCourses = async () => {
    try {
      const response = await axios.get('/api/courses');
      setCourses(response.data);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const handleAddCourse = async () => {
    try {
      await axios.post('/api/courses', newCourse);
      setShowAddCourse(false);
      setNewCourse({ name: '', description: '' });
      fetchCourses();
    } catch (err) {
      console.error('Error adding course:', err);
    }
  };

  const handleAddLecture = async () => {
    try {
      await axios.post('/api/lectures', {
        ...newLecture,
        courseId: selectedCourse.id
      });
      setShowAddLecture(false);
      setNewLecture({
        courseId: '',
        lectureNo: '',
        topic: '',
        date: '',
        notes: { type: 'url', content: '' }
      });
      fetchCourses();
    } catch (err) {
      console.error('Error adding lecture:', err);
    }
  };

  return (
    <Container>
      <Header>
        <PageTitle>Lectures at IIITD</PageTitle>
      </Header>

      {/* Courses Section */}
      <SectionContainer>
        <SectionHeader>
          <h2>Courses</h2>
          <AddButton onClick={() => setShowAddCourse(true)}>
            <FiPlus /> Add Course
          </AddButton>
        </SectionHeader>

        <CourseGrid>
          {courses.map(course => (
            <CourseCard key={course.id}>
              <CourseName>{course.name}</CourseName>
              <CourseDescription>{course.description}</CourseDescription>
            </CourseCard>
          ))}
        </CourseGrid>
      </SectionContainer>

      {/* Lectures Section */}
      <SectionContainer>
        <SectionHeader>
          <h2>Lectures</h2>
          <div>
            <Select
              value={selectedCourse?.id || ''}
              onChange={(e) => {
                const course = courses.find(c => c.id === e.target.value);
                setSelectedCourse(course);
              }}
              style={{ marginRight: '1rem' }}
            >
              <option value="">Select Course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </Select>
            <AddButton 
              onClick={() => setShowAddLecture(true)}
              disabled={!selectedCourse}
            >
              <FiPlus /> Add Lecture
            </AddButton>
          </div>
        </SectionHeader>

        {selectedCourse && (
          <Table>
            <thead>
              <tr>
                <th>Lecture No.</th>
                <th>Topic</th>
                <th>Date</th>
                <th>Get Notes</th>
              </tr>
            </thead>
            <tbody>
              {selectedCourse.lectures?.map(lecture => (
                <tr key={lecture.id}>
                  <td>{lecture.lectureNo}</td>
                  <td>{lecture.topic}</td>
                  <td>{formatDate(lecture.date)}</td>
                  <td>
                    {lecture.notes.type === 'url' ? (
                      <NoteLink href={lecture.notes.content} target="_blank">
                        <FiLink /> View Notes
                      </NoteLink>
                    ) : (
                      <NoteLink href={lecture.notes.content} download>
                        <FiDownload /> Download PDF
                      </NoteLink>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </SectionContainer>

      {/* Course Modal */}
      {showAddCourse && (
        <Modal>
          <ModalContent>
            <h2>Add New Course</h2>
            <Input
              placeholder="Course Name"
              value={newCourse.name}
              onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
            />
            <Input
              placeholder="Course Description"
              value={newCourse.description}
              onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
            />
            <ButtonGroup>
              <Button onClick={handleAddCourse}>Add</Button>
              <Button secondary onClick={() => setShowAddCourse(false)}>Cancel</Button>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}

      {/* Lecture Modal */}
      {showAddLecture && (
        <Modal>
          <ModalContent>
            <h2>Add New Lecture</h2>
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
            <Select
              value={newLecture.notes.type}
              onChange={(e) => setNewLecture({
                ...newLecture,
                notes: { ...newLecture.notes, type: e.target.value }
              })}
            >
              <option value="url">URL</option>
              <option value="pdf">PDF Upload</option>
            </Select>
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
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => {/* Add file handling logic */}}
              />
            )}
            <ButtonGroup>
              <Button onClick={handleAddLecture}>Add</Button>
              <Button secondary onClick={() => setShowAddLecture(false)}>Cancel</Button>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

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

const Container = styled.div`
  padding: 2rem;
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
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  background: ${props => props.secondary ? '#e0e0e0' : '#3f51b5'};
  color: ${props => props.secondary ? '#333' : 'white'};
  cursor: pointer;
`;

const AddButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: ${props => props.small ? '0.5rem 1rem' : '0.75rem 1.5rem'};
  font-size: ${props => props.small ? '0.875rem' : '1rem'};
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

export default Lectures;

