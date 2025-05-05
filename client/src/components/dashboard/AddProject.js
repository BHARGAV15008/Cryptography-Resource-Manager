import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaProjectDiagram, FaTimes, FaPlus, FaTimes as FaRemove } from 'react-icons/fa';
import axios from 'axios';

const AddProject = ({ onClose, onProjectAdded, onProjectUpdated, projectToEdit }) => {
  const [professors, setProfessors] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Research',
    startDate: '',
    endDate: '',
    professor_id: '',
    status: 'active',
    technologies: [],
    members: [],
    publication_url: ''
  });
  
  const [newTechnology, setNewTechnology] = useState('');
  const [newMember, setNewMember] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Initialize form data when editing
  useEffect(() => {
    if (projectToEdit) {
      // Parse technologies and members if they're stored as JSON strings
      let technologies = [];
      let members = [];
      
      if (projectToEdit.tags) {
        try {
          technologies = typeof projectToEdit.tags === 'string' 
            ? JSON.parse(projectToEdit.tags) 
            : Array.isArray(projectToEdit.tags) ? projectToEdit.tags : [];
        } catch (e) {
          console.error('Error parsing technologies:', e);
        }
      }
      
      if (projectToEdit.members) {
        try {
          members = typeof projectToEdit.members === 'string' 
            ? JSON.parse(projectToEdit.members) 
            : Array.isArray(projectToEdit.members) ? projectToEdit.members : [];
        } catch (e) {
          console.error('Error parsing members:', e);
        }
      }
      
      setFormData({
        title: projectToEdit.title || '',
        description: projectToEdit.description || '',
        type: projectToEdit.category || 'Research',
        startDate: projectToEdit.start_date ? new Date(projectToEdit.start_date).toISOString().split('T')[0] : '',
        endDate: projectToEdit.end_date ? new Date(projectToEdit.end_date).toISOString().split('T')[0] : '',
        professor_id: projectToEdit.professor_id || projectToEdit.leader_id || '',
        status: projectToEdit.status || 'active',
        technologies: technologies,
        members: members,
        publication_url: projectToEdit.publication_url || ''
      });
    }
  }, [projectToEdit]);
  
  // Fetch professors for dropdown
  useEffect(() => {
    const fetchProfessors = async () => {
      try {
        const API_BASE_URL = 'http://localhost:5001';
        const response = await axios.get(`${API_BASE_URL}/api/professors`);
        setProfessors(response.data);
      } catch (error) {
        console.error('Error fetching professors:', error);
        setError('Failed to load professors. Please try again.');
      }
    };
    
    fetchProfessors();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const addTechnology = () => {
    if (newTechnology.trim() !== '') {
      setFormData(prev => ({
        ...prev,
        technologies: [...prev.technologies, newTechnology.trim()]
      }));
      setNewTechnology('');
    }
  };
  
  const removeTechnology = (index) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.filter((_, i) => i !== index)
    }));
  };
  
  const addMember = () => {
    if (newMember.trim() !== '') {
      setFormData(prev => ({
        ...prev,
        members: [...prev.members, newMember.trim()]
      }));
      setNewMember('');
    }
  };
  
  const removeMember = (index) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index)
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Find the selected professor to include in team members
      const selectedProfessor = professors.find(prof => prof.id.toString() === formData.professor_id.toString());
      const professorName = selectedProfessor ? selectedProfessor.name : '';
      
      // Add professor as a guide in the team members with a special role
      const teamMembers = [
        ...formData.members,
        { name: professorName, role: 'Guide', professor_id: formData.professor_id }
      ];
      
      // Convert arrays to JSON strings for the API
      const projectData = {
        ...formData,
        technologies: JSON.stringify(formData.technologies),
        members: JSON.stringify(teamMembers)
      };
      
      const API_BASE_URL = 'http://localhost:5001';
      let response;
      
      if (projectToEdit) {
        // Update existing project
        response = await axios.put(`${API_BASE_URL}/api/projects/${projectToEdit.id}`, projectData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        console.log('Project updated successfully:', response.data);
        
        // Notify parent component
        if (onProjectUpdated) {
          onProjectUpdated(response.data);
        }
      } else {
        // Create new project
        response = await axios.post(`${API_BASE_URL}/api/projects`, projectData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        console.log('Project added successfully:', response.data);
        
        // Notify parent component
        if (onProjectAdded) {
          onProjectAdded(response.data);
        }
      }
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Error saving project:', error);
      setError(error.response?.data?.message || 'Failed to save project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal>
      <ModalContent>
        <ModalHeader>
          <h2>
            <FaProjectDiagram />
            {projectToEdit ? 'Edit Project' : 'Add New Project'}
          </h2>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter project title"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="description">Description *</Label>
            <TextArea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Enter project description"
            />
          </FormGroup>
          
          <FormRow>
            <FormGroup>
              <Label htmlFor="type">Project Type *</Label>
              <Select 
                name="type" 
                value={formData.type} 
                onChange={handleChange}
                required
              >
                <option value="IP">IP</option>
                <option value="IS">IS</option>
                <option value="BTP">BTP</option>
                <option value="Capstone">Capstone</option>
                <option value="Thesis">Thesis</option>
                <option value="Research">Research</option>
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="status">Status *</Label>
              <Select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </Select>
            </FormGroup>
          </FormRow>
          
          <FormRow>
            <FormGroup>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
              />
            </FormGroup>
          </FormRow>
          
          <FormGroup>
            <Label htmlFor="professor_id">Guide/Professor *</Label>
            <Select
              id="professor_id"
              name="professor_id"
              value={formData.professor_id}
              onChange={handleChange}
              required
            >
              <option value="">Select a professor</option>
              {professors.map(professor => (
                <option key={professor.id} value={professor.id}>
                  {professor.name}
                </option>
              ))}
            </Select>
          </FormGroup>
          
          <FormGroup>
            <Label>Technologies</Label>
            <TagInputContainer>
              <TagInput
                type="text"
                value={newTechnology}
                onChange={(e) => setNewTechnology(e.target.value)}
                placeholder="Add a technology"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
              />
              <AddButton type="button" onClick={addTechnology}>
                <FaPlus />
              </AddButton>
            </TagInputContainer>
            
            <TagList>
              {formData.technologies.map((tech, index) => (
                <Tag key={index}>
                  {tech}
                  <RemoveTagButton type="button" onClick={() => removeTechnology(index)}>
                    <FaRemove />
                  </RemoveTagButton>
                </Tag>
              ))}
            </TagList>
          </FormGroup>
          
          <FormGroup>
            <Label>Team Members</Label>
            <TagInputContainer>
              <TagInput
                type="text"
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
                placeholder="Add a team member"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMember())}
              />
              <AddButton type="button" onClick={addMember}>
                <FaPlus />
              </AddButton>
            </TagInputContainer>
            
            <TagList>
              {formData.members.map((member, index) => (
                <Tag key={index}>
                  {member}
                  <RemoveTagButton type="button" onClick={() => removeMember(index)}>
                    <FaRemove />
                  </RemoveTagButton>
                </Tag>
              ))}
            </TagList>
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="publication_url">Publication URL</Label>
            <Input
              id="publication_url"
              name="publication_url"
              type="url"
              value={formData.publication_url}
              onChange={handleChange}
              placeholder="https://example.com/publication"
            />
          </FormGroup>
          
          <ButtonGroup>
            <CancelButton type="button" onClick={onClose}>
              Cancel
            </CancelButton>
            <SubmitButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : projectToEdit ? 'Update Project' : 'Add Project'}
            </SubmitButton>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </Modal>
  );
};

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
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
  
  h2 {
    margin: 0;
    display: flex;
    align-items: center;
    font-size: 1.5rem;
    
    svg {
      margin-right: 0.5rem;
      color: #1a237e;
    }
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  
  &:hover {
    color: #f44336;
  }
`;

const Form = styled.form`
  padding: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
  width: 100%;
`;

const FormRow = styled.div`
  display: flex;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #1a237e;
    box-shadow: 0 0 0 2px rgba(26, 35, 126, 0.2);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #1a237e;
    box-shadow: 0 0 0 2px rgba(26, 35, 126, 0.2);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: #1a237e;
    box-shadow: 0 0 0 2px rgba(26, 35, 126, 0.2);
  }
`;

const TagInputContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const TagInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #1a237e;
    box-shadow: 0 0 0 2px rgba(26, 35, 126, 0.2);
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1a237e;
  color: white;
  border: none;
  border-radius: 4px;
  width: 40px;
  cursor: pointer;
  
  &:hover {
    background-color: #0e1859;
  }
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const Tag = styled.div`
  display: flex;
  align-items: center;
  background-color: #e8eaf6;
  color: #1a237e;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
`;

const RemoveTagButton = styled.button`
  background: none;
  border: none;
  color: #1a237e;
  margin-left: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  
  &:hover {
    color: #f44336;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
`;

const CancelButton = styled(Button)`
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  color: #333;
  
  &:hover {
    background-color: #e0e0e0;
  }
`;

const SubmitButton = styled(Button)`
  background-color: #1a237e;
  border: none;
  color: white;
  
  &:hover {
    background-color: #0e1859;
  }
  
  &:disabled {
    background-color: #9fa8da;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background-color: #ffebee;
  color: #c62828;
  padding: 0.75rem;
  border-radius: 4px;
  margin: 1rem;
  font-size: 0.9rem;
`;

export default AddProject;
