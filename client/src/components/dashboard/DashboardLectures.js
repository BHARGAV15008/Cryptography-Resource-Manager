import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaBook, FaVideo, FaPlus, FaEdit, FaTrash, FaExclamationCircle, FaSync } from 'react-icons/fa';
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
    return token ? { headers: { 'x-auth-token': token } } : {};
  };
  
  // DIRECT DATABASE ACCESS - NO MOCK DATA
  const fetchDataFromDatabase = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const API_BASE_URL = 'http://localhost:5001';
      
      // Always fetch courses data for reference (needed for both tabs)
      try {
        console.log('DIRECT DATABASE FETCH: Getting courses from MySQL database...');
        
        // Make a direct database request without custom headers to avoid CORS issues
        const coursesResponse = await axios.get(`${API_BASE_URL}/api/courses`, {
          params: { timestamp: new Date().getTime() }
        });
        
        console.log('DATABASE RESPONSE (COURSES):', coursesResponse.data);
        
        // Set courses directly from database response
        setCourses(coursesResponse.data);
      } catch (err) {
        console.error('DATABASE ERROR fetching courses:', err);
        if (activeTab === 'courses') {
          setError('Failed to load courses from database. Please try again.');
        }
        setCourses([]);
      }
      
      // If on lectures tab, also fetch lectures data
      if (activeTab === 'lectures') {
        try {
          console.log('DIRECT DATABASE FETCH: Getting lectures from MySQL database...');
          
          // Make a direct database request without custom headers to avoid CORS issues
          const lecturesResponse = await axios.get(`${API_BASE_URL}/api/lectures`, {
            params: { timestamp: new Date().getTime() }
          });
          
          console.log('DATABASE RESPONSE (LECTURES):', lecturesResponse.data);
          
          // Set lectures directly from database response
          setLectures(lecturesResponse.data);
        } catch (err) {
          console.error('DATABASE ERROR fetching lectures:', err);
          setError('Failed to load lectures from database. Please try again.');
          setLectures([]);
        }
      }
    } catch (err) {
      console.error(`GENERAL DATABASE ERROR:`, err);
      setError(`Database connection error. Please try again later.`);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial data fetch on component mount and tab change
  useEffect(() => {
    fetchDataFromDatabase();
  }, [activeTab]);
  
  const handleCourseAdded = (newCourse) => {
    console.log('Course added to database, refreshing data...');
    // Refresh data directly from database instead of updating state locally
    fetchDataFromDatabase();
  };
  
  const handleLectureAdded = (newLecture) => {
    console.log('Lecture added to database, refreshing data...');
    // Refresh data directly from database instead of updating state locally
    fetchDataFromDatabase();
  };

  const handleCourseUpdated = (updatedCourse) => {
    console.log('Course updated in database, refreshing data...');
    // Refresh data directly from database instead of updating state locally
    fetchDataFromDatabase();
  };
  
  const handleLectureUpdated = (updatedLecture) => {
    console.log('Lecture updated in database, refreshing data...');
    // Refresh data directly from database instead of updating state locally
    fetchDataFromDatabase();
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
        console.log(`DIRECT DATABASE DELETE: Deleting course with ID: ${courseId}`);
        
        // Make the delete request to the server with no caching
        const response = await axios.delete(`${API_BASE_URL}/api/courses/${courseId}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0',
            'x-auth-token': localStorage.getItem('token') || ''
          }
        });
        
        console.log('DATABASE DELETE RESPONSE:', response.data);
        
        // Always refresh from database after deletion
        fetchDataFromDatabase();
        
        alert('Course deleted successfully. Refreshing data from database.');
      } catch (err) {
        console.error('DATABASE ERROR deleting course:', err);
        alert('Failed to delete course from database. Please try again.');
      }
    }
  };
  
  const handleDeleteLecture = async (lectureId) => {
    if (window.confirm('Are you sure you want to delete this lecture?')) {
      try {
        const API_BASE_URL = 'http://localhost:5001';
        console.log(`DIRECT DATABASE DELETE: Deleting lecture with ID: ${lectureId}`);
        
        // Make the delete request to the server with no caching
        const response = await axios.delete(`${API_BASE_URL}/api/lectures/${lectureId}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0',
            'x-auth-token': localStorage.getItem('token') || ''
          }
        });
        
        console.log('DATABASE DELETE RESPONSE:', response.data);
        
        // Always refresh from database after deletion
        fetchDataFromDatabase();
        
        alert('Lecture deleted successfully. Refreshing data from database.');
      } catch (err) {
        console.error('DATABASE ERROR deleting lecture:', err);
        alert('Failed to delete lecture from database. Please try again.');
      }
    }
  };
  
  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  // Helper function to get course title from course ID
  const getCourseTitle = (courseId, coursesList) => {
    if (!courseId || !coursesList || !coursesList.length) return 'Unknown Course';
    const course = coursesList.find(c => c.id === courseId);
    return course ? (course.title || course.name) : 'Unknown Course';
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
        <ActionButtonsContainer>
          <RefreshButton onClick={fetchDataFromDatabase} title="Refresh data from database">
            <FaSync />
            <span>Refresh from Database</span>
          </RefreshButton>
          <AddButton 
            onClick={() => activeTab === 'courses' 
              ? setShowAddCourseModal(true) 
              : setShowAddLectureModal(true)}
          >
            <FaPlus />
            <span>Add {activeTab === 'courses' ? 'Course' : 'Lecture'}</span>
          </AddButton>
        </ActionButtonsContainer>
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
                    <td>{lecture.course_title || getCourseTitle(lecture.course_id, courses) || 'N/A'}</td>
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

const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 10px;
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #4a6da7;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: #3a5d97;
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
