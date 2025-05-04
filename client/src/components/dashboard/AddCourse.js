import React, { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { FaTimes, FaUpload } from 'react-icons/fa';

const AddCourse = ({ onClose, onCourseAdded, professors }) => {
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    semester: 'Fall',
    year: new Date().getFullYear(),
    professor_id: '',
    syllabus_url: ''
  });
  
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const API_BASE_URL = 'http://localhost:5001';
      
      // Create FormData object for file upload
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      
      if (image) {
        data.append('image', image);
      }
      
      const response = await axios.post(
        `${API_BASE_URL}/api/courses`,
        data,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      onCourseAdded({
        ...formData,
        id: response.data.courseId,
        professor_name: professors.find(p => p.id === parseInt(formData.professor_id))?.name || null
      });
      
      onClose();
    } catch (err) {
      console.error('Error adding course:', err);
      setError(err.response?.data?.message || 'Failed to add course. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <h2>Add New Course</h2>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="title">Course Title*</Label>
            <Input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., Introduction to Cryptography"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="code">Course Code*</Label>
            <Input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
              placeholder="e.g., CRYPT101"
            />
          </FormGroup>
          
          <FormRow>
            <FormGroup>
              <Label htmlFor="semester">Semester</Label>
              <Select
                id="semester"
                name="semester"
                value={formData.semester}
                onChange={handleChange}
              >
                <option value="Fall">Fall</option>
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
                <option value="Winter">Winter</option>
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="year">Year</Label>
              <Input
                type="number"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                min="2000"
                max="2100"
              />
            </FormGroup>
          </FormRow>
          
          <FormGroup>
            <Label htmlFor="professor_id">Professor</Label>
            <Select
              id="professor_id"
              name="professor_id"
              value={formData.professor_id}
              onChange={handleChange}
            >
              <option value="">Select a professor</option>
              {professors.map(professor => (
                <option key={professor.id} value={professor.id}>
                  {professor.name} ({professor.title})
                </option>
              ))}
            </Select>
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="description">Description</Label>
            <TextArea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Course description and objectives"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="syllabus_url">Syllabus URL</Label>
            <Input
              type="url"
              id="syllabus_url"
              name="syllabus_url"
              value={formData.syllabus_url}
              onChange={handleChange}
              placeholder="https://example.com/syllabus.pdf"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="image">Course Image</Label>
            <FileInputWrapper>
              <FileInputLabel htmlFor="image">
                <FaUpload />
                <span>Choose Image</span>
              </FileInputLabel>
              <FileInput
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
              />
              {imagePreview && (
                <ImagePreview>
                  <img src={imagePreview} alt="Preview" />
                </ImagePreview>
              )}
            </FileInputWrapper>
          </FormGroup>
          
          <ButtonGroup>
            <CancelButton type="button" onClick={onClose}>
              Cancel
            </CancelButton>
            <SubmitButton type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Course'}
            </SubmitButton>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  
  h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #1a237e;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #666;
  
  &:hover {
    color: #1a237e;
  }
`;

const Form = styled.form`
  padding: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const FormRow = styled.div`
  display: flex;
  gap: 1rem;
  
  > div {
    flex: 1;
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

const FileInputWrapper = styled.div`
  display: flex;
  flex-direction: column;
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
  width: fit-content;
  
  &:hover {
    background-color: #e0e0e0;
  }
  
  svg {
    margin-right: 0.5rem;
  }
`;

const ImagePreview = styled.div`
  margin-top: 1rem;
  
  img {
    max-width: 100%;
    max-height: 200px;
    border-radius: 4px;
    border: 1px solid #ddd;
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
  cursor: pointer;
  transition: all 0.2s;
`;

const CancelButton = styled(Button)`
  background-color: white;
  color: #666;
  border: 1px solid #ddd;
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

const SubmitButton = styled(Button)`
  background-color: #1a237e;
  color: white;
  border: none;
  
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
  padding: 1rem;
  margin: 1rem 1.5rem 0;
  border-radius: 4px;
  font-size: 0.875rem;
`;

export default AddCourse;
