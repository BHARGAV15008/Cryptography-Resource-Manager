import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const CryptoIIITD = () => {
  const [professors, setProfessors] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Default professor image as a data URI
  const defaultProfessorImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='120' height='120'%3E%3Cpath fill='%23e0e0e0' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

  useEffect(() => {
    const fetchProfessors = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/professors');
        setProfessors(response.data);
        console.log("Fetched professors:", response.data);
      } catch (error) {
        console.error('Error fetching professors:', error);
      }
    };

    fetchProfessors();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5001/api/projects');
        console.log("Fetched projects:", response.data);
        setProjects(response.data);
        
        // Save to localStorage for persistence
        localStorage.setItem('projects', JSON.stringify(response.data));
      } catch (error) {
        console.error('Error fetching projects:', error);
        
        // Try to load from localStorage if API fails
        const savedProjects = localStorage.getItem('projects');
        if (savedProjects) {
          try {
            setProjects(JSON.parse(savedProjects));
          } catch (e) {
            console.error('Error parsing saved projects:', e);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const getProjectStatus = (startDate, endDate) => {
    if (!endDate) return 'active';
    
    const now = new Date();
    const end = new Date(endDate);
    return now > end ? 'completed' : 'active';
  };
  
  // Function to parse JSON strings
  const parseJsonField = (field) => {
    if (!field) return [];
    
    try {
      if (typeof field === 'string') {
        // Try to parse as JSON
        const parsed = JSON.parse(field);
        return Array.isArray(parsed) ? parsed : [parsed];
      } else if (Array.isArray(field)) {
        return field;
      } else if (typeof field === 'object') {
        return [field];
      }
      return [];
    } catch (e) {
      console.error('Error parsing field:', e, field);
      // If it's a string but not valid JSON, return it as a single item array
      return typeof field === 'string' ? [field] : [];
    }
  };
  
  // Find professor by ID
  const findProfessorById = (id) => {
    if (!id) return { name: 'Unknown' };
    
    // Try to match by string or number ID
    const professor = professors.find(prof => {
      return prof.id === id || 
             prof.id === parseInt(id) || 
             prof.id?.toString() === id?.toString();
    });
    
    return professor || { name: 'Unknown' };
  };

  return (
    <PageContainer>
      <Header>
        <h1>Crypto@IIITD</h1>
        <p>Center of Excellence in Cryptography Research and Development</p>
      </Header>

      <ContentSection>
        <SectionTitle>About Our Program</SectionTitle>
        <Description>
          The Cryptography Research Program at IIIT-Delhi is dedicated to advancing the field of cryptography
          through cutting-edge research, education, and industry collaboration. Our focus areas include:
        </Description>

        <FocusAreas>
          <FocusArea>
            <h3>Research Areas</h3>
            <ul>
              <li>Post-Quantum Cryptography</li>
              <li>Blockchain Technology</li>
              <li>Zero-Knowledge Proofs</li>
              <li>Homomorphic Encryption</li>
              <li>Cryptanalysis</li>
            </ul>
          </FocusArea>

          <FocusArea>
            <h3>Education</h3>
            <ul>
              <li>Advanced Cryptography Courses</li>
              <li>Research Opportunities</li>
              <li>Industry Partnerships</li>
              <li>Workshops and Seminars</li>
              <li>International Collaborations</li>
            </ul>
          </FocusArea>

          <FocusArea>
            <h3>Innovation</h3>
            <ul>
              <li>Security Solutions</li>
              <li>Privacy Technologies</li>
              <li>Protocol Development</li>
              <li>Applied Cryptography</li>
              <li>Industry Projects</li>
            </ul>
          </FocusArea>
        </FocusAreas>
      </ContentSection>

      <ContentSection>
        <SectionTitle>Our Vision</SectionTitle>
        <Description>
          To be a world-leading center for cryptographic research and education, fostering innovation
          and developing secure solutions for the digital world. We aim to bridge the gap between
          theoretical research and practical applications in cryptography.
        </Description>
      </ContentSection>

      <ContentSection>
        <SectionTitle>Professors</SectionTitle>
        <ProfessorList>
          {professors.map((professor) => (
            <ProfessorItem key={professor.id}>
              <ProfessorImage 
                src={professor.image_url || defaultProfessorImage} 
                alt={professor.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = defaultProfessorImage;
                }}
              />
              <ProfessorName>{professor.name}</ProfessorName>
              <ProfessorDesignation>{professor.title}</ProfessorDesignation>
              <p>{professor.specialization}</p>
              <ProfessorContact>
                <a href={`mailto:${professor.email}`}>Email: {professor.email}</a>
                {professor.website_url && (
                  <a href={professor.website_url} target="_blank" rel="noopener noreferrer">
                    Website
                  </a>
                )}
              </ProfessorContact>
            </ProfessorItem>
          ))}
        </ProfessorList>
      </ContentSection>

      <ContentSection>
        <SectionTitle>Research Projects</SectionTitle>
        {loading ? (
          <LoadingMessage>Loading projects...</LoadingMessage>
        ) : projects.length === 0 ? (
          <EmptyMessage>No projects available at the moment.</EmptyMessage>
        ) : (
          <ProjectsContainer>
            {projects.map((project) => {
              // Debug logging
              console.log("Processing project:", project);
              
              // Handle different field names that might contain technologies
              const technologies = parseJsonField(project.tags || project.technologies);
              console.log("Technologies:", technologies);
              
              // Handle different field names that might contain members
              const members = parseJsonField(project.team_members || project.members);
              console.log("Members:", members);
              
              // Find the guide in the team members
              let guideName = "Unknown";
              const guideEntry = members.find(member => 
                (typeof member === 'object' && member.role === 'Guide') || 
                (typeof member === 'string' && member.includes('Guide:'))
              );
              
              if (guideEntry) {
                guideName = typeof guideEntry === 'object' ? guideEntry.name : guideEntry.replace('Guide:', '').trim();
              } else {
                // Fallback to professor lookup if no guide found in team members
                const professorId = project.professor_id;
                if (professorId) {
                  const professor = findProfessorById(professorId);
                  guideName = professor.name;
                }
              }
              
              // Filter out the guide from the displayed team members
              const teamMembers = members.filter(member => 
                !(typeof member === 'object' && member.role === 'Guide') && 
                !(typeof member === 'string' && member.includes('Guide:'))
              );
              
              const status = project.status || getProjectStatus(project.start_date, project.end_date);
              
              return (
                <ProjectCard key={project.id}>
                  <ProjectHeader>
                    <ProjectTitle>{project.title}</ProjectTitle>
                    <ProjectType>
                      {project.category === 'IP' && 'Independent Project'}
                      {project.category === 'IS' && 'Independent Study'}
                      {project.category === 'BTP' && 'B.Tech Project'}
                      {project.category === 'Capstone' && 'Capstone Project'}
                      {project.category === 'Thesis' && 'M.Tech Thesis'}
                      {!(project.category === 'IP' || project.category === 'IS' || project.category === 'BTP' || project.category === 'Capstone' || project.category === 'Thesis') && 'Research'}
                    </ProjectType>
                  </ProjectHeader>
                  
                  <ProjectTimeframe>
                    {project.start_date && (
                      <>
                        {new Date(project.start_date).toLocaleDateString()} 
                        {project.end_date && ` - ${new Date(project.end_date).toLocaleDateString()}`}
                      </>
                    )}
                    <ProjectStatus $status={project.status}>
                      {project.status === 'planning' && 'Planning'}
                      {project.status === 'active' && 'Active'}
                      {project.status === 'completed' && 'Completed'}
                      {project.status === 'archived' && 'Archived'}
                      {!project.status && 'Active'}
                    </ProjectStatus>
                  </ProjectTimeframe>
                  
                  <ProjectDescription>
                    {project.description}
                  </ProjectDescription>
                  
                  <ProjectTeam>
                    <TeamSection>
                      <TeamTitle>Guide</TeamTitle>
                      <MembersList>
                        <MemberItem>{guideName}</MemberItem>
                      </MembersList>
                    </TeamSection>
                    
                    {teamMembers && teamMembers.length > 0 && (
                      <TeamSection>
                        <TeamTitle>Team Members</TeamTitle>
                        <MembersList>
                          {teamMembers.map((member, index) => (
                            <MemberItem key={index}>{typeof member === 'object' ? member.name || 'Unknown' : member}</MemberItem>
                          ))}
                        </MembersList>
                      </TeamSection>
                    )}
                  </ProjectTeam>
                  
                  {technologies && technologies.length > 0 && (
                    <TechStack>
                      <TeamTitle>Technologies</TeamTitle>
                      <TechList>
                        {technologies.map((tech, index) => (
                          <TechItem key={index}>{typeof tech === 'object' ? tech.name || 'Unknown' : tech}</TechItem>
                        ))}
                      </TechList>
                    </TechStack>
                  )}
                  
                  {project.publication_url && (
                    <PublicationLink>
                      <a href={project.publication_url} target="_blank" rel="noopener noreferrer">
                        View Publication
                      </a>
                    </PublicationLink>
                  )}
                </ProjectCard>
              );
            })}
          </ProjectsContainer>
        )}
      </ContentSection>
    </PageContainer>
  );
};

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem;
  background: ${({ theme }) => theme.colors.background};
  border-radius: 8px;
  
  h1 {
    font-size: 2.5rem;
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: 1rem;
  }
  
  p {
    font-size: 1.2rem;
    color: ${({ theme }) => theme.colors.textLight};
  }
`;

const ContentSection = styled.section`
  margin-bottom: 4rem;
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 1.5rem;
  position: relative;
  
  &:after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 0;
    width: 60px;
    height: 4px;
    background: ${({ theme }) => theme.colors.secondary};
  }
`;

const Description = styled.p`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const FocusAreas = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
`;

const FocusArea = styled.div`
  background: ${({ theme }) => theme.colors.backgroundLight};
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows.small};

  h3 {
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: 1rem;
    font-size: 1.3rem;
  }
  
  ul {
    list-style-type: none;
    padding-left: 1em;
    
    li {
      margin-bottom: 0.8rem;
      color: ${({ theme }) => theme.colors.text};
      font-size: 1rem;
      
      &:before {
        content: "•";
        color: ${({ theme }) => theme.colors.primary};
        font-weight: bold;
        display: inline-block;
        width: 1em;
        margin-left: -1em;
      }
    }
  }
`;

const ProfessorList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 1rem;
`;

const ProfessorItem = styled.div`
  background: ${({ theme }) => theme.colors.backgroundLight};
  padding: 2rem;
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.shadows.medium};
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const ProfessorImage = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  object-fit: cover;
  margin-bottom: 1rem;
  border: 3px solid ${({ theme }) => theme.colors.primary};
`;

const ProfessorName = styled.h3`
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1.4rem;
  margin-bottom: 1rem;
`;

const ProfessorDesignation = styled.p`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
`;

const ProfessorContact = styled.div`
  margin-top: 1rem;
  
  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
    display: block;
    margin-bottom: 0.5rem;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.textLight};
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.textLight};
  background: ${({ theme }) => theme.colors.backgroundLight};
  border-radius: 8px;
`;

const ProjectsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-top: 1rem;
`;

const ProjectCard = styled.div`
  background: ${({ theme }) => theme.colors.backgroundLight};
  padding: 2rem;
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.shadows.medium};
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const ProjectHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const ProjectTitle = styled.h3`
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1.4rem;
  margin-bottom: 0;
  flex: 1;
`;

const ProjectType = styled.span`
  background: ${({ theme }) => theme.colors.secondary};
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 15px;
  font-size: 0.9rem;
`;

const ProjectTimeframe = styled.div`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ProjectStatus = styled.span`
  margin-left: 0.5rem;
  font-weight: 500;
  background: ${({ $status, theme }) => 
    $status === 'completed' ? theme.colors.success : 
    $status === 'active' ? theme.colors.warning : 
    $status === 'planning' ? theme.colors.info : 
    $status === 'archived' ? theme.colors.error : 
    theme.colors.warning};
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
`;

const ProjectDescription = styled.p`
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.6;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
`;

const ProjectTeam = styled.div`
  margin: 2rem 0;
`;

const TeamSection = styled.div`
  margin-bottom: 1.5rem;
`;

const TeamTitle = styled.h4`
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 0.8rem;
  font-size: 1.1rem;
`;

const MembersList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

const MemberItem = styled.span`
  background: ${({ theme }) => theme.colors.backgroundLight};
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const TechStack = styled.div`
  margin-bottom: 1.5rem;
`;

const TechList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
`;

const TechItem = styled.span`
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
`;

const PublicationLink = styled.div`
  margin-top: 1.5rem;
  
  a {
    display: inline-block;
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

export default CryptoIIITD;