import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaBook, FaVideo, FaPlus, FaEdit, FaTrash, FaExclamationCircle } from 'react-icons/fa';
import axios from 'axios';
import AddCourse from './AddCourse';
import AddLecture from './AddLecture';

const DashboardLectures = () => {
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showAddLectureModal, setShowAddLectureModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingLecture, setEditingLecture] = useState(null);
  
  // Function to get auth header for API requests
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const API_BASE_URL = 'http://localhost:5001';
        
        if (activeTab === 'courses') {
          try {
            const response = await axios.get(`${API_BASE_URL}/api/courses`, getAuthHeader());
            setCourses(response.data.length > 0 ? response.data : [
              { 
                id: 1, 
                title: 'Introduction to Cryptography', 
                code: 'CRYPT101', 
                description: 'An introductory course to cryptography concepts',
                semester: 'Fall',
                year: 2023,
                professor_name: 'Dr. Smith'
              },
              { 
                id: 2, 
                title: 'Advanced Encryption', 
                code: 'CRYPT201', 
                description: 'Advanced topics in modern encryption techniques',
                semester: 'Spring',
                year: 2023,
                professor_name: 'Dr. Johnson'
              }
            ]);
          } catch (err) {
            console.error('Error fetching courses:', err);
            // Set dummy data if API fails
            setCourses([
              { 
                id: 1, 
                title: 'Introduction to Cryptography', 
                code: 'CRYPT101', 
                description: 'An introductory course to cryptography concepts',
                semester: 'Fall',
                year: 2023,
                professor_name: 'Dr. Smith'
              },
              { 
                id: 2, 
                title: 'Advanced Encryption', 
                code: 'CRYPT201', 
                description: 'Advanced topics in modern encryption techniques',
                semester: 'Spring',
                year: 2023,
                professor_name: 'Dr. Johnson'
              }
            ]);
          }
        } else {
          try {
            const response = await axios.get(`${API_BASE_URL}/api/lectures`, getAuthHeader());
            setLectures(response.data.length > 0 ? response.data : [
              {
                id: 1,
                title: 'Symmetric Key Cryptography',
                description: 'Introduction to symmetric key algorithms',
                course_id: 1,
                course_title: 'Introduction to Cryptography',
                lecture_date: '2023-09-15',
                slides_url: 'https://example.com/slides1.pdf',
                video_url: 'https://example.com/video1.mp4'
              },
              {
                id: 2,
                title: 'Public Key Infrastructure',
                description: 'Understanding PKI and its applications',
                course_id: 2,
                course_title: 'Advanced Encryption',
                lecture_date: '2023-10-20',
                slides_url: 'https://example.com/slides2.pdf',
                video_url: 'https://example.com/video2.mp4'
              }
            ]);
          } catch (err) {
            console.error('Error fetching lectures:', err);
            // Set dummy data if API fails
            setLectures([
              {
                id: 1,
                title: 'Symmetric Key Cryptography',
                description: 'Introduction to symmetric key algorithms',
                course_id: 1,
                course_title: 'Introduction to Cryptography',
                lecture_date: '2023-09-15',
                slides_url: 'https://example.com/slides1.pdf',
                video_url: 'https://example.com/video1.mp4'
              },
              {
                id: 2,
                title: 'Public Key Infrastructure',
                description: 'Understanding PKI and its applications',
                course_id: 2,
                course_title: 'Advanced Encryption',
                lecture_date: '2023-10-20',
                slides_url: 'https://example.com/slides2.pdf',
                video_url: 'https://example.com/video2.mp4'
              }
            ]);
          }
        }
      } catch (err) {
        console.error(`Error fetching ${activeTab}:`, err);
        setError(`Failed to load ${activeTab}. Please try again later.`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [activeTab]);
  
  const handleCourseAdded = (newCourse) => {
    setCourses(prev => [...prev, newCourse]);
  };
  
  const handleLectureAdded = (newLecture) => {
    setLectures(prev => [...prev, newLecture]);
  };

  const handleCourseUpdated = (updatedCourse) => {
    setCourses(prev => prev.map(course => 
      course.id === updatedCourse.id ? updatedCourse : course
    ));
  };
  
  const handleLectureUpdated = (updatedLecture) => {
    setLectures(prev => prev.map(lecture => 
      lecture.id === updatedLecture.id ? updatedLecture : lecture
    ));
  };
  
  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setShowAddCourseModal(true);
  };
  
  const handleEditLecture = (lecture) => {
    setEditingLecture(lecture);
    setShowAddLectureModal(true);
  };
  
  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course? This will also delete all associated lectures.')) {
      try {
        const API_BASE_URL = 'http://localhost:5001';
        await axios.delete(`${API_BASE_URL}/api/courses/${courseId}`, getAuthHeader());
        setCourses(prev => prev.filter(course => course.id !== courseId));
      } catch (err) {
        console.error('Error deleting course:', err);
        alert('Failed to delete course. Please try again later.');
      }
    }
  };
  
  const handleDeleteLecture = async (lectureId) => {
    if (window.confirm('Are you sure you want to delete this lecture?')) {
      try {
        const API_BASE_URL = 'http://localhost:5001';
        await axios.delete(`${API_BASE_URL}/api/lectures/${lectureId}`, getAuthHeader());
        setLectures(prev => prev.filter(lecture => lecture.id !== lectureId));
      } catch (err) {
        console.error('Error deleting lecture:', err);
        alert('Failed to delete lecture. Please try again later.');
      }
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  return (
    <DashboardContainer>
      <Header>
        <h1>Lecture Management</h1>
      </Header>
      
      <TabsContainer>
        <Tab 
          $active={activeTab === 'courses'} 
          onClick={() => setActiveTab('courses')}
        >
          <FaBook />
          <span>Courses</span>
        </Tab>
        <Tab 
          $active={activeTab === 'lectures'} 
          onClick={() => setActiveTab('lectures')}
        >
          <FaVideo />
          <span>Lectures</span>
        </Tab>
      </TabsContainer>
      
      <ContentHeader>
        <h2>{activeTab === 'courses' ? 'Courses' : 'Lectures'}</h2>
        <AddButton 
          onClick={() => activeTab === 'courses' 
            ? setShowAddCourseModal(true) 
            : setShowAddLectureModal(true)}
        >
          <FaPlus />
          <span>Add {activeTab === 'courses' ? 'Course' : 'Lecture'}</span>
        </AddButton>
      </ContentHeader>
      
      {error && (
        <ErrorMessage>
          <FaExclamationCircle />
          <span>{error}</span>
        </ErrorMessage>
      )}
      
      {loading ? (
        <LoadingMessage>Loading {activeTab}...</LoadingMessage>
      ) : activeTab === 'courses' ? (
        <CoursesTableContainer>
          {courses.length === 0 ? (
            <EmptyState>
              <h3>No courses found</h3>
              <p>Add your first course to get started.</p>
              <AddButton onClick={() => setShowAddCourseModal(true)}>
                <FaPlus />
                <span>Add Course</span>
              </AddButton>
            </EmptyState>
          ) : (
            <CoursesTable>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Code</th>
                  <th>Semester</th>
                  <th>Year</th>
                  <th>Professor</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(course => (
                  <tr key={course.id}>
                    <td>
                      <CourseTitle>{course.title}</CourseTitle>
                      <CourseDescription>{course.description?.substring(0, 100)}{course.description?.length > 100 ? '...' : ''}</CourseDescription>
                    </td>
                    <td>{course.code}</td>
                    <td>{course.semester || 'N/A'}</td>
                    <td>{course.year || 'N/A'}</td>
                    <td>{course.professor_name || 'N/A'}</td>
                    <td>
                      <ActionButtons>
                        <EditButton onClick={() => handleEditCourse(course)}>
                          <FaEdit />
                          <span>Edit</span>
                        </EditButton>
                        <DeleteButton onClick={() => handleDeleteCourse(course.id)}>
                          <FaTrash />
                          <span>Delete</span>
                        </DeleteButton>
                      </ActionButtons>
                    </td>
                  </tr>
                ))}
              </tbody>
            </CoursesTable>
          )}
        </CoursesTableContainer>
      ) : (
        <LecturesTableContainer>
          {lectures.length === 0 ? (
            <EmptyState>
              <h3>No lectures found</h3>
              <p>Add your first lecture to get started.</p>
              <AddButton onClick={() => setShowAddLectureModal(true)}>
                <FaPlus />
                <span>Add Lecture</span>
              </AddButton>
            </EmptyState>
          ) : (
            <LecturesTable>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Course</th>
                  <th>Date</th>
                  <th>Resources</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lectures.map(lecture => (
                  <tr key={lecture.id}>
                    <td>
                      <LectureTitle>{lecture.title}</LectureTitle>
                      <LectureDescription>{lecture.description?.substring(0, 100)}{lecture.description?.length > 100 ? '...' : ''}</LectureDescription>
                    </td>
                    <td>{lecture.course_title || 'N/A'}</td>
                    <td>{formatDate(lecture.lecture_date)}</td>
                    <td>
                      <ResourceLinks>
                        {lecture.slides_url && (
                          <ResourceLink href={lecture.slides_url} target="_blank" rel="noopener noreferrer">
                            Slides
                          </ResourceLink>
                        )}
                        {lecture.video_url && (
                          <ResourceLink href={lecture.video_url} target="_blank" rel="noopener noreferrer">
                            Video
                          </ResourceLink>
                        )}
                      </ResourceLinks>
                    </td>
                    <td>
                      <ActionButtons>
                        <EditButton onClick={() => handleEditLecture(lecture)}>
                          <FaEdit />
                          <span>Edit</span>
                        </EditButton>
                        <DeleteButton onClick={() => handleDeleteLecture(lecture.id)}>
                          <FaTrash />
                          <span>Delete</span>
                        </DeleteButton>
                      </ActionButtons>
                    </td>
                  </tr>
                ))}
              </tbody>
            </LecturesTable>
          )}
        </LecturesTableContainer>
      )}
      
      {showAddCourseModal && (
        <AddCourse 
          onClose={() => {
            setShowAddCourseModal(false);
            setEditingCourse(null);
          }} 
          onCourseAdded={handleCourseAdded}
          onCourseUpdated={handleCourseUpdated}
          professors={[]} // You'll need to fetch professors
          courseToEdit={editingCourse}
        />
      )}
      
      {showAddLectureModal && (
        <AddLecture 
          onClose={() => {
            setShowAddLectureModal(false);
            setEditingLecture(null);
          }} 
          onLectureAdded={handleLectureAdded}
          onLectureUpdated={handleLectureUpdated}
          courses={courses}
          lectureToEdit={editingLecture}
        />
      )}
    </DashboardContainer>
  );
};

const DashboardContainer = styled.div`
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 2rem;
`;

const Tab = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  padding: 1rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  color: ${props => props.$active ? '#1a237e' : '#666'};
  border-bottom: 3px solid ${props => props.$active ? '#1a237e' : 'transparent'};
  transition: all 0.2s;
  
  &:hover {
    color: #1a237e;
  }
  
  svg {
    margin-right: 0.5rem;
  }
`;

const ContentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  
  h2 {
    margin: 0;
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  background-color: #1a237e;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  
  &:hover {
    background-color: #0e1859;
  }
  
  svg {
    margin-right: 0.5rem;
  }
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  background-color: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  
  svg {
    margin-right: 0.5rem;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
  color: #666;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  background-color: #f5f5f5;
  border-radius: 8px;
  grid-column: 1 / -1;
  
  h3 {
    margin-bottom: 0.5rem;
  }
  
  p {
    margin-bottom: 1.5rem;
    color: #666;
  }
`;

const CoursesTableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const CoursesTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  background-color: white;
  
  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
  }
  
  th {
    background-color: #f5f5f5;
    font-weight: 600;
    color: #333;
  }
  
  tbody tr:hover {
    background-color: #f9f9f9;
  }
  
  td:first-child {
    max-width: 300px;
  }
`;

const LecturesTableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const LecturesTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  background-color: white;
  
  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
  }
  
  th {
    background-color: #f5f5f5;
    font-weight: 600;
    color: #333;
  }
  
  tbody tr:hover {
    background-color: #f9f9f9;
  }
  
  td:first-child {
    max-width: 300px;
  }
`;

const CourseTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
`;

const CourseDescription = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: #666;
`;

const LectureTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
`;

const LectureDescription = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: #666;
`;

const ResourceLinks = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ResourceLink = styled.a`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background-color: #e3f2fd;
  color: #1565c0;
  border-radius: 4px;
  font-size: 0.875rem;
  text-decoration: none;
  
  &:hover {
    background-color: #bbdefb;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const EditButton = styled.button`
  display: flex;
  align-items: center;
  background-color: #e3f2fd;
  color: #1565c0;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  
  &:hover {
    background-color: #bbdefb;
  }
  
  svg {
    margin-right: 0.25rem;
  }
`;

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  background-color: #ffebee;
  color: #c62828;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  
  &:hover {
    background-color: #ffcdd2;
  }
  
  svg {
    margin-right: 0.25rem;
  }
`;

export default DashboardLectures;
