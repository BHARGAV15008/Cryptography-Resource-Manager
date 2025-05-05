import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { FaSearch, FaExternalLinkAlt, FaSpinner } from 'react-icons/fa';

const About = () => {
  const [professors, setProfessors] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedProjectType, setSelectedProjectType] = useState('');
  
  // Selected professor data
  const [activeProfessor, setActiveProfessor] = useState(null);
  
  // Get unique years from projects
  const years = [...new Set(projects.map(project => project.year))].sort((a, b) => b - a);
  
  // Get unique project types
  const projectTypes = [...new Set(projects.map(project => project.type))];
  
  useEffect(() => {
    const fetchProfessors = async () => {
      try {
        setLoading(true);
        const API_BASE_URL = 'http://localhost:5001';
        const response = await axios.get(`${API_BASE_URL}/api/professors`);
        
        // Check if the response has a value property (from our API)
        const professorsData = response.data.value || response.data;
        console.log('Fetched professors:', professorsData);
        setProfessors(professorsData);
        
        // Set first professor as active by default if available
        if (professorsData.length > 0) {
          fetchProfessorDetails(professorsData[0].id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching professors:', err);
        setError('Failed to load professors. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchProfessors();
  }, []);
  
  const fetchProfessorDetails = async (professorId) => {
    try {
      setLoading(true);
      const API_BASE_URL = 'http://localhost:5001';
      const response = await axios.get(`${API_BASE_URL}/api/professors/${professorId}`);
      
      // Check if the response has data
      const professorData = response.data;
      console.log('Fetched professor details:', professorData);
      
      setActiveProfessor(professorData);
      setProjects(professorData.projects || []);
      setSelectedProfessor(professorId);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching professor details:', err);
      setError('Failed to load professor details. Please try again later.');
      setLoading(false);
    }
  };
  
  const handleProfessorChange = (e) => {
    const professorId = e.target.value;
    if (professorId) {
      fetchProfessorDetails(professorId);
    } else {
      setActiveProfessor(null);
      setProjects([]);
      setSelectedProfessor('');
    }
  };
  
  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
  };
  
  const handleProjectTypeChange = (e) => {
    setSelectedProjectType(e.target.value);
  };
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Filter projects based on selected filters
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesYear = selectedYear ? project.year === parseInt(selectedYear) : true;
    const matchesType = selectedProjectType ? project.type === selectedProjectType : true;
    
    return matchesSearch && matchesYear && matchesType;
  });
  
  // Helper function to get status badge color
  const getStatusColor = (status) => {
    switch(status) {
      case 'completed':
        return '#34A853'; // Green
      case 'in_progress':
        return '#FBBC05'; // Yellow
      case 'updating':
        return '#4285F4'; // Blue
      default:
        return '#9AA0A6'; // Gray
    }
  };
  
  // Helper function to get status text
  const getStatusText = (status) => {
    switch(status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'updating':
        return 'Updating';
      default:
        return '-';
    }
  };
  
  return (
    <PageContainer>
      <PageHeader>
        <h1>crypto-iiitd</h1>
        <p>Meet our professors and explore their cryptography research projects</p>
      </PageHeader>
      
      <FiltersContainer>
        <SearchBarContainer>
          <SearchIcon />
          <SearchInput 
            type="text" 
            placeholder="Search projects..." 
            value={searchTerm}
            onChange={handleSearch}
          />
        </SearchBarContainer>
        
        <FilterDropdown
          value={selectedProfessor}
          onChange={handleProfessorChange}
        >
          <option value="">All Professors</option>
          {professors.map(professor => (
            <option key={professor.id} value={professor.id}>
              {professor.name}
            </option>
          ))}
        </FilterDropdown>
        
        <FilterDropdown
          value={selectedYear}
          onChange={handleYearChange}
        >
          <option value="">All Years</option>
          {years.map(year => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </FilterDropdown>
        
        <FilterDropdown
          value={selectedProjectType}
          onChange={handleProjectTypeChange}
        >
          <option value="">All Project Types</option>
          {projectTypes.map(type => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </FilterDropdown>
      </FiltersContainer>
      
      {loading ? (
        <LoadingContainer>
          <FaSpinner className="spinner" />
          <p>Loading...</p>
        </LoadingContainer>
      ) : error ? (
        <ErrorContainer>
          <p>{error}</p>
        </ErrorContainer>
      ) : activeProfessor ? (
        <ContentContainer>
          <ProfessorCard>
            <ProfessorImage 
              src={activeProfessor.profile_image || activeProfessor.image_url || '/default-professor.png'} 
              alt={activeProfessor.name} 
              onError={(e) => {
                // If image fails to load, replace with default
                e.target.src = '/default-professor.png';
              }}
            />
            <ProfessorName>{activeProfessor.name}</ProfessorName>
            <ProfessorTitle>{activeProfessor.title}</ProfessorTitle>
            <ProfessorSpecialization>{activeProfessor.specialization}</ProfessorSpecialization>
            {activeProfessor.website_url && (
              <ProfessorWebsite href={activeProfessor.website_url} target="_blank" rel="noopener noreferrer">
                Visit Website <FaExternalLinkAlt />
              </ProfessorWebsite>
            )}
          </ProfessorCard>
          
          <ProjectsContainer>
            <ProjectsHeader>
              <h2>Projects</h2>
              <p>{filteredProjects.length} projects found</p>
            </ProjectsHeader>
            
            {filteredProjects.length > 0 ? (
              <ProjectsList>
                {filteredProjects.map(project => (
                  <ProjectCard key={project.id}>
                    <ProjectHeader>
                      <ProjectTitle>{project.title}</ProjectTitle>
                      <StatusBadge color={getStatusColor(project.status)}>
                        {getStatusText(project.status)}
                      </StatusBadge>
                    </ProjectHeader>
                    <ProjectType>{project.type}</ProjectType>
                    <ProjectYear>{project.year}</ProjectYear>
                    {project.description && (
                      <ProjectDescription>{project.description}</ProjectDescription>
                    )}
                    {project.members && (
                      <ProjectMembers>
                        <strong>Team:</strong> {project.members}
                      </ProjectMembers>
                    )}
                    {(project.repo_url || project.demo_url) && (
                      <ProjectLinks>
                        {project.repo_url && (
                          <ProjectLink href={project.repo_url} target="_blank" rel="noopener noreferrer">
                            Repository
                          </ProjectLink>
                        )}
                        {project.demo_url && (
                          <ProjectLink href={project.demo_url} target="_blank" rel="noopener noreferrer">
                            Demo
                          </ProjectLink>
                        )}
                      </ProjectLinks>
                    )}
                  </ProjectCard>
                ))}
              </ProjectsList>
            ) : (
              <NoProjectsMessage>
                No projects found matching your filters.
              </NoProjectsMessage>
            )}
          </ProjectsContainer>
        </ContentContainer>
      ) : (
        <NoSelectionMessage>
          <p>Please select a professor to view their details and projects.</p>
        </NoSelectionMessage>
      )}
    </PageContainer>
  );
};

// Styled Components
const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const PageHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2.5rem;
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: 0.5rem;
  }
  
  p {
    font-size: 1.1rem;
    color: ${({ theme }) => theme.colors.textLight};
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const SearchBarContainer = styled.div`
  position: relative;
  flex: 1;
  min-width: 200px;
`;

const SearchIcon = styled(FaSearch)`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.textLight};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primaryLight};
  }
`;

const FilterDropdown = styled.select`
  padding: 0.75rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  background-color: white;
  font-size: 1rem;
  min-width: 180px;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primaryLight};
  }
`;

const ContentContainer = styled.div`
  display: flex;
  gap: 2rem;
  
  @media (max-width: 992px) {
    flex-direction: column;
  }
`;

const ProfessorCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  width: 300px;
  
  @media (max-width: 992px) {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
  }
`;

const ProfessorImage = styled.img`
  width: 180px;
  height: 180px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 1.5rem;
  border: 4px solid ${({ theme }) => theme.colors.primaryLight};
`;

const ProfessorName = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-align: center;
`;

const ProfessorTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textLight};
  margin-bottom: 1rem;
  text-align: center;
`;

const ProfessorSpecialization = styled.p`
  text-align: center;
  margin-bottom: 1.5rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.text};
`;

const ProfessorWebsite = styled.a`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
  
  svg {
    font-size: 0.8rem;
  }
`;

const ProjectsContainer = styled.div`
  flex: 1;
`;

const ProjectsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  
  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text};
  }
  
  p {
    color: ${({ theme }) => theme.colors.textLight};
  }
`;

const ProjectsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ProjectCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const ProjectHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
`;

const ProjectTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-right: 1rem;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  background-color: ${props => props.color};
  white-space: nowrap;
`;

const ProjectType = styled.div`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 500;
  margin-bottom: 0.5rem;
`;

const ProjectYear = styled.div`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textLight};
  margin-bottom: 1rem;
`;

const ProjectDescription = styled.p`
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.text};
`;

const ProjectMembers = styled.p`
  font-size: 0.9rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.text};
`;

const ProjectLinks = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const ProjectLink = styled.a`
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  border-radius: 4px;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryLighter};
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  
  .spinner {
    font-size: 2rem;
    color: ${({ theme }) => theme.colors.primary};
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  p {
    margin-top: 1rem;
    color: ${({ theme }) => theme.colors.textLight};
  }
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: 2rem;
  background-color: #FEE8E7;
  border-radius: 8px;
  color: #D93025;
`;

const NoSelectionMessage = styled.div`
  text-align: center;
  padding: 3rem;
  background-color: #F8F9FA;
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.textLight};
`;

const NoProjectsMessage = styled.div`
  text-align: center;
  padding: 2rem;
  background-color: #F8F9FA;
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.textLight};
`;

export default About;