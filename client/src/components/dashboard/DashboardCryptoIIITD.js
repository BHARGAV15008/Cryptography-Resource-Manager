import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaUserTie, FaProjectDiagram, FaPlus, FaEdit, FaTrash, FaExclamationCircle } from 'react-icons/fa';
import axios from 'axios';
import AddProfessor from './AddProfessor';
import AddProject from './AddProject';

const DashboardCryptoIIITD = () => {
  const [activeTab, setActiveTab] = useState('professors');
  const [professors, setProfessors] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddProfessorModal, setShowAddProfessorModal] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  
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
        
        if (activeTab === 'professors') {
          const response = await axios.get(`${API_BASE_URL}/api/professors`, getAuthHeader());
          setProfessors(response.data);
        } else {
          const response = await axios.get(`${API_BASE_URL}/api/projects`, getAuthHeader());
          setProjects(response.data);
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
  
  const handleProfessorAdded = (newProfessor) => {
    setProfessors(prev => [...prev, newProfessor]);
  };
  
  const handleProjectAdded = (newProject) => {
    setProjects(prev => [...prev, newProject]);
  };
  
  const handleDeleteProfessor = async (id) => {
    if (!id) {
      setError("Cannot delete professor: ID is missing");
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this professor? This action cannot be undone.')) {
      try {
        setError(null);
        const API_BASE_URL = 'http://localhost:5001';
        
        await axios.delete(`${API_BASE_URL}/api/professors/${id}`, getAuthHeader());
        
        // Remove from local state
        setProfessors(prev => prev.filter(professor => professor.id !== id));
        
        // Show success message
        alert('Professor deleted successfully');
      } catch (error) {
        console.error("Error deleting professor:", error);
        setError("Failed to delete professor");
      }
    }
  };
  
  const handleDeleteProject = async (id) => {
    if (!id) {
      setError("Cannot delete project: ID is missing");
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        setError(null);
        const API_BASE_URL = 'http://localhost:5001';
        
        await axios.delete(`${API_BASE_URL}/api/projects/${id}`, getAuthHeader());
        
        // Remove from local state
        setProjects(prev => prev.filter(project => project.id !== id));
        
        // Show success message
        alert('Project deleted successfully');
      } catch (error) {
        console.error("Error deleting project:", error);
        setError("Failed to delete project");
      }
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString();
  };
  
  // Default professor image as a data URI
  const defaultProfessorImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTkiPlByb2Zlc3NvciBJbWFnZTwvdGV4dD48L3N2Zz4=';
  
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = defaultProfessorImage;
  };
  
  return (
    <DashboardContainer>
      <Header>
        <div>
          <h1>Crypto@IIITD Management</h1>
          <p>Manage professors and research projects</p>
        </div>
      </Header>
      
      <TabsContainer>
        <Tab 
          $active={activeTab === 'professors'} 
          onClick={() => setActiveTab('professors')}
        >
          <FaUserTie />
          <span>Professors</span>
        </Tab>
        <Tab 
          $active={activeTab === 'projects'} 
          onClick={() => setActiveTab('projects')}
        >
          <FaProjectDiagram />
          <span>Projects</span>
        </Tab>
      </TabsContainer>
      
      {error && (
        <ErrorMessage>
          <FaExclamationCircle />
          <span>{error}</span>
        </ErrorMessage>
      )}
      
      <ContentHeader>
        <h2>{activeTab === 'professors' ? 'Professors' : 'Research Projects'}</h2>
        <AddButton 
          onClick={() => activeTab === 'professors' 
            ? setShowAddProfessorModal(true) 
            : setShowAddProjectModal(true)
          }
        >
          <FaPlus />
          <span>Add {activeTab === 'professors' ? 'Professor' : 'Project'}</span>
        </AddButton>
      </ContentHeader>
      
      {loading ? (
        <LoadingMessage>Loading {activeTab}...</LoadingMessage>
      ) : activeTab === 'professors' ? (
        <ProfessorsGrid>
          {professors.length === 0 ? (
            <EmptyState>
              <h3>No professors found</h3>
              <p>Add your first professor to get started.</p>
              <AddButton onClick={() => setShowAddProfessorModal(true)}>
                <FaPlus />
                <span>Add Professor</span>
              </AddButton>
            </EmptyState>
          ) : (
            professors.map(professor => (
              <ProfessorCard key={professor.id}>
                <ProfessorImage 
                  src={professor.profile_image || defaultProfessorImage} 
                  alt={professor.name}
                  onError={handleImageError}
                />
                <ProfessorContent>
                  <ProfessorName>{professor.name}</ProfessorName>
                  <ProfessorTitle>{professor.title}</ProfessorTitle>
                  <ProfessorInfo>
                    <strong>Email:</strong> {professor.email}
                  </ProfessorInfo>
                  {professor.specialization && (
                    <ProfessorInfo>
                      <strong>Specialization:</strong> {professor.specialization}
                    </ProfessorInfo>
                  )}
                  {professor.website && (
                    <ProfessorInfo>
                      <strong>Website:</strong> <a href={professor.website} target="_blank" rel="noopener noreferrer">{professor.website}</a>
                    </ProfessorInfo>
                  )}
                  <ActionButtons>
                    <EditButton>
                      <FaEdit />
                      <span>Edit</span>
                    </EditButton>
                    <DeleteButton onClick={() => handleDeleteProfessor(professor.id)}>
                      <FaTrash />
                      <span>Delete</span>
                    </DeleteButton>
                  </ActionButtons>
                </ProfessorContent>
              </ProfessorCard>
            ))
          )}
        </ProfessorsGrid>
      ) : (
        <ProjectsTableContainer>
          {projects.length === 0 ? (
            <EmptyState>
              <h3>No projects found</h3>
              <p>Add your first research project to get started.</p>
              <AddButton onClick={() => setShowAddProjectModal(true)}>
                <FaPlus />
                <span>Add Project</span>
              </AddButton>
            </EmptyState>
          ) : (
            <>
              <ProjectsTable>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Technologies</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map(project => {
                    // Parse technologies if it's a JSON string
                    let techArray = [];
                    if (project.tags) {
                      try {
                        techArray = typeof project.tags === 'string' 
                          ? JSON.parse(project.tags) 
                          : Array.isArray(project.tags) ? project.tags : [];
                      } catch (e) {
                        console.error('Error parsing technologies:', e);
                      }
                    }
                    
                    return (
                      <tr key={project.id}>
                        <td>
                          <ProjectTitle>{project.title}</ProjectTitle>
                          <ProjectDescription>{project.description?.substring(0, 100)}{project.description?.length > 100 ? '...' : ''}</ProjectDescription>
                        </td>
                        <td>
                          <ProjectType type={project.category}>{project.category || 'Research'}</ProjectType>
                        </td>
                        <td>
                          <ProjectStatus status={project.status}>{project.status || 'Ongoing'}</ProjectStatus>
                        </td>
                        <td>{formatDate(project.start_date)}</td>
                        <td>{formatDate(project.end_date)}</td>
                        <td>
                          <TechList>
                            {techArray.length > 0 
                              ? techArray.slice(0, 3).map((tech, idx) => (
                                  <TechItem key={idx}>{tech}</TechItem>
                                ))
                              : <span>-</span>
                            }
                            {techArray.length > 3 && <TechItem>+{techArray.length - 3}</TechItem>}
                          </TechList>
                        </td>
                        <td>
                          <ActionButtons>
                            <EditButton>
                              <FaEdit />
                              <span>Edit</span>
                            </EditButton>
                            <DeleteButton onClick={() => handleDeleteProject(project.id)}>
                              <FaTrash />
                              <span>Delete</span>
                            </DeleteButton>
                          </ActionButtons>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </ProjectsTable>
            </>
          )}
        </ProjectsTableContainer>
      )}
      
      {showAddProfessorModal && (
        <AddProfessor 
          onClose={() => setShowAddProfessorModal(false)} 
          onProfessorAdded={handleProfessorAdded}
        />
      )}
      
      {showAddProjectModal && (
        <AddProject 
          onClose={() => setShowAddProjectModal(false)} 
          onProjectAdded={handleProjectAdded}
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

// Professors Styles
const ProfessorsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
`;

const ProfessorCard = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  background-color: white;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const ProfessorImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
`;

const ProfessorContent = styled.div`
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ProfessorName = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
`;

const ProfessorTitle = styled.div`
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

const ProfessorInfo = styled.div`
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  
  a {
    color: #1a237e;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

// Projects Styles
const ProjectsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
`;

const ProjectsTableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const ProjectsTable = styled.table`
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

const ProjectCard = styled.div`
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  background-color: white;
  padding: 1.5rem;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const ProjectHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const ProjectTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  flex: 1;
`;

const ProjectType = styled.div`
  display: inline-block;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: white;
  background-color: ${props => {
    switch (props.type) {
      case 'Research':
        return '#1a237e'; // Dark blue
      case 'Development':
        return '#4caf50'; // Green
      case 'Industry':
        return '#ff9800'; // Orange
      case 'Academic':
        return '#9c27b0'; // Purple
      default:
        return '#757575'; // Grey
    }
  }};
`;

const ProjectDates = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
`;

const ProjectStatus = styled.div`
  display: inline-block;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: white;
  background-color: ${props => {
    switch (props.status) {
      case 'Ongoing':
        return '#4caf50'; // Green
      case 'Completed':
        return '#1a237e'; // Dark blue
      case 'Planned':
        return '#ff9800'; // Orange
      default:
        return '#757575'; // Grey
    }
  }};
`;

const ProjectDescription = styled.p`
  margin-bottom: 1rem;
  font-size: 0.9rem;
`;

const ProjectInfo = styled.div`
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
`;

const ProjectTechnologies = styled.div`
  margin-bottom: 1rem;
  font-size: 0.9rem;
`;

const TechList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const TechItem = styled.div`
  background-color: #e8eaf6;
  color: #1a237e;
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  font-size: 0.8rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
`;

const EditButton = styled.button`
  display: inline-flex;
  align-items: center;
  background-color: #2196f3;
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  
  &:hover {
    background-color: #1976d2;
  }
  
  svg {
    margin-right: 0.3rem;
  }
`;

const DeleteButton = styled.button`
  display: inline-flex;
  align-items: center;
  background-color: #f44336;
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  
  &:hover {
    background-color: #d32f2f;
  }
  
  svg {
    margin-right: 0.3rem;
  }
`;

export default DashboardCryptoIIITD;
