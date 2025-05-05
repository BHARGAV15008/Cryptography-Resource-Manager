import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaUserTie, FaTimes, FaUpload } from 'react-icons/fa';
import axios from 'axios';

const AddProfessor = ({ onClose, onProfessorAdded, onProfessorUpdated, professorToEdit }) => {
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    email: '',
    department: 'Cryptography',
    specialization: '',
    biography: '',
    website: ''
  });
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Initialize form data when editing
  useEffect(() => {
    if (professorToEdit) {
      setFormData({
        name: professorToEdit.name || '',
        title: professorToEdit.title || '',
        email: professorToEdit.email || '',
        department: professorToEdit.department || 'Cryptography',
        specialization: professorToEdit.specialization || '',
        biography: professorToEdit.biography || '',
        website: professorToEdit.website || ''
      });
      
      if (professorToEdit.profile_image) {
        setPreviewUrl(professorToEdit.profile_image);
      }
    }
  }, [professorToEdit]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Create a FormData object to handle file upload
      const professorData = new FormData();
      
      // Instead of using FormData for file upload, we'll use a direct approach with the data URL
      // Create a regular object for the professor data
      const professorDataObj = { ...formData };
      
      // Handle image data
      if (selectedImage) {
        console.log('Processing image file...');
        // Create a promise to read the file as data URL
        const readFileAsDataURL = () => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(selectedImage);
          });
        };
        
        try {
          // Get the data URL and use it directly
          const dataUrl = await readFileAsDataURL();
          console.log('Image converted to data URL');
          professorDataObj.profile_image = dataUrl;
        } catch (readError) {
          console.error('Error reading image file:', readError);
        }
      } else if (previewUrl && previewUrl.startsWith('data:')) {
        // If we already have a data URL, use it directly
        console.log('Using existing data URL for image');
        professorDataObj.profile_image = previewUrl;
      }
      
      const API_BASE_URL = 'http://localhost:5001';
      let response;
      
      if (professorToEdit) {
        // Update existing professor
        console.log('Updating professor with data:', professorDataObj);
        response = await axios.put(`${API_BASE_URL}/api/professors/${professorToEdit.id}`, professorDataObj, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        console.log('Professor updated successfully:', response.data);
        
        // Notify parent component
        if (onProfessorUpdated) {
          onProfessorUpdated(response.data);
        }
      } else {
        // Create new professor
        console.log('Creating new professor with data:', professorDataObj);
        response = await axios.post(`${API_BASE_URL}/api/professors`, professorDataObj, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        console.log('Professor added successfully:', response.data);
        
        // Notify parent component
        if (onProfessorAdded) {
          onProfessorAdded(response.data);
        }
      }
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Error saving professor:', error);
      setError(error.response?.data?.message || 'Failed to save professor. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isEditMode = !!professorToEdit;
  
  return (
    <Modal>
      <ModalContent>
        <ModalHeader>
          <h2><FaUserTie /> {isEditMode ? 'Edit Professor' : 'Add New Professor'}</h2>
          <CloseButton onClick={onClose}><FaTimes /></CloseButton>
        </ModalHeader>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter professor's full name"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="title">Title/Position *</Label>
            <Input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., Associate Professor, Professor"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter email address"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="specialization">Specialization</Label>
            <Input
              type="text"
              id="specialization"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              placeholder="e.g., Post-Quantum Cryptography, Blockchain Security"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="biography">Biography</Label>
            <TextArea
              id="biography"
              name="biography"
              value={formData.biography}
              onChange={handleChange}
              placeholder="Enter a brief biography"
              rows={4}
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="website">Website URL</Label>
            <Input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="e.g., https://faculty.iiitd.ac.in/professor"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="image">Profile Image</Label>
            <ImageUploadContainer>
              {previewUrl ? (
                <ImagePreview src={previewUrl} alt="Preview" />
              ) : (
                <UploadPlaceholder>
                  <FaUpload />
                  <span>Upload Image</span>
                </UploadPlaceholder>
              )}
              <ImageInput
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
              />
            </ImageUploadContainer>
            <ImageNote>Recommended size: 300x300px, Max size: 5MB</ImageNote>
          </FormGroup>
          
          <ButtonGroup>
            <CancelButton type="button" onClick={onClose}>Cancel</CancelButton>
            <SubmitButton type="submit" disabled={isSubmitting}>
              {isSubmitting 
                ? (isEditMode ? 'Updating...' : 'Adding...') 
                : (isEditMode ? 'Update Professor' : 'Add Professor')
              }
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
  max-width: 600px;
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

const ImageUploadContainer = styled.div`
  position: relative;
  width: 150px;
  height: 150px;
  border: 2px dashed #ddd;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  
  &:hover {
    border-color: #1a237e;
  }
`;

const ImageInput = styled.input`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
`;

const UploadPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #666;
  
  svg {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
`;

const ImagePreview = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ImageNote = styled.p`
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #666;
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

export default AddProfessor;
