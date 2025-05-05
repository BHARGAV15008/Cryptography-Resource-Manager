import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { FaTimes, FaUpload, FaPlus, FaTrash } from 'react-icons/fa';

const AddLecture = ({ onClose, onLectureAdded, onLectureUpdated, courses, lectureToEdit }) => {
  const [formData, setFormData] = useState({
    title: '',
    course_id: '',
    lecture_date: new Date().toISOString().split('T')[0],
    description: '',
    video_url: '',
    additional_resources: []
  });
  
  const [slides, setSlides] = useState(null);
  const [slidesName, setSlidesName] = useState('');
  const [video, setVideo] = useState(null);
  const [videoName, setVideoName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resource, setResource] = useState({ name: '', url: '' });
  const [isEditMode, setIsEditMode] = useState(false);
  
  useEffect(() => {
    if (lectureToEdit) {
      setFormData({
        title: lectureToEdit.title || '',
        course_id: lectureToEdit.course_id?.toString() || '',
        lecture_date: lectureToEdit.lecture_date ? new Date(lectureToEdit.lecture_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        description: lectureToEdit.description || '',
        video_url: lectureToEdit.video_url || '',
        additional_resources: lectureToEdit.additional_resources || []
      });
      
      if (lectureToEdit.slides_url) {
        setSlidesName('Current slides file');
      }
      
      if (lectureToEdit.video_url) {
        setVideoName('Current video file');
      }
      
      setIsEditMode(true);
    }
  }, [lectureToEdit]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSlidesChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSlides(file);
      setSlidesName(file.name);
    }
  };
  
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideo(file);
      setVideoName(file.name);
    }
  };
  
  const handleResourceChange = (e) => {
    const { name, value } = e.target;
    setResource(prev => ({ ...prev, [name]: value }));
  };
  
  const addResource = () => {
    if (resource.name && resource.url) {
      setFormData(prev => ({
        ...prev,
        additional_resources: [...prev.additional_resources, { ...resource }]
      }));
      setResource({ name: '', url: '' });
    }
  };
  
  const removeResource = (index) => {
    setFormData(prev => ({
      ...prev,
      additional_resources: prev.additional_resources.filter((_, i) => i !== index)
    }));
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
        if (key === 'additional_resources') {
          data.append(key, JSON.stringify(formData[key]));
        } else {
          data.append(key, formData[key]);
        }
      });
      
      if (slides) {
        data.append('slides', slides);
      }
      
      if (video) {
        data.append('video', video);
      }
      
      let response;
      
      if (isEditMode) {
        response = await axios.put(
          `${API_BASE_URL}/api/lectures/${lectureToEdit.id}`,
          data,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        onLectureUpdated({
          ...formData,
          id: lectureToEdit.id,
          course_title: courses.find(c => c.id === parseInt(formData.course_id))?.title || null,
          slides_url: response.data.slides_url || lectureToEdit.slides_url,
          video_url: response.data.video_url || lectureToEdit.video_url
        });
      } else {
        response = await axios.post(
          `${API_BASE_URL}/api/lectures`,
          data,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        onLectureAdded({
          ...formData,
          id: response.data.lectureId,
          course_title: courses.find(c => c.id === parseInt(formData.course_id))?.title || null
        });
      }
      
      onClose();
    } catch (err) {
      console.error(`Error ${isEditMode ? 'updating' : 'adding'} lecture:`, err);
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} lecture. Please try again.`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <h2>{isEditMode ? 'Edit Lecture' : 'Add New Lecture'}</h2>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="title">Lecture Title*</Label>
            <Input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., Introduction to Symmetric Encryption"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="course_id">Course*</Label>
            <Select
              id="course_id"
              name="course_id"
              value={formData.course_id}
              onChange={handleChange}
              required
            >
              <option value="">Select a course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.title} ({course.code})
                </option>
              ))}
            </Select>
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="lecture_date">Lecture Date</Label>
            <Input
              type="date"
              id="lecture_date"
              name="lecture_date"
              value={formData.lecture_date}
              onChange={handleChange}
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="description">Description</Label>
            <TextArea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Lecture description and topics covered"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="slides">Lecture Slides</Label>
            <FileInputWrapper>
              <FileInputLabel htmlFor="slides">
                <FaUpload />
                <span>Choose File</span>
              </FileInputLabel>
              <FileInput
                type="file"
                id="slides"
                accept=".pdf,.ppt,.pptx"
                onChange={handleSlidesChange}
              />
              {slidesName && <FileName>{slidesName}</FileName>}
            </FileInputWrapper>
          </FormGroup>
          
          <FormRow>
            <FormGroup>
              <Label htmlFor="video_url">Video URL</Label>
              <Input
                type="url"
                id="video_url"
                name="video_url"
                value={formData.video_url}
                onChange={handleChange}
                placeholder="e.g., https://youtube.com/watch?v=..."
              />
            </FormGroup>
            
            <FormGroup>
              <Label>OR Upload Video</Label>
              <FileInputWrapper>
                <FileInputLabel htmlFor="video">
                  <FaUpload />
                  <span>Choose File</span>
                </FileInputLabel>
                <FileInput
                  type="file"
                  id="video"
                  accept=".mp4,.webm"
                  onChange={handleVideoChange}
                />
                {videoName && <FileName>{videoName}</FileName>}
              </FileInputWrapper>
            </FormGroup>
          </FormRow>
          
          <FormGroup>
            <Label>Additional Resources</Label>
            <ResourcesContainer>
              {formData.additional_resources.map((res, index) => (
                <ResourceItem key={index}>
                  <ResourceName>{res.name}</ResourceName>
                  <ResourceUrl href={res.url} target="_blank" rel="noopener noreferrer">
                    {res.url}
                  </ResourceUrl>
                  <ResourceRemoveButton type="button" onClick={() => removeResource(index)}>
                    <FaTrash />
                  </ResourceRemoveButton>
                </ResourceItem>
              ))}
              
              <ResourceInputGroup>
                <Input
                  type="text"
                  placeholder="Resource Name"
                  name="name"
                  value={resource.name}
                  onChange={handleResourceChange}
                />
                <Input
                  type="url"
                  placeholder="Resource URL"
                  name="url"
                  value={resource.url}
                  onChange={handleResourceChange}
                />
                <ResourceAddButton type="button" onClick={addResource}>
                  <FaPlus />
                </ResourceAddButton>
              </ResourceInputGroup>
            </ResourcesContainer>
          </FormGroup>
          
          <ButtonGroup>
            <CancelButton type="button" onClick={onClose}>
              Cancel
            </CancelButton>
            <SubmitButton type="submit" disabled={loading}>
              {loading ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Lecture' : 'Add Lecture')}
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
  
  @media (max-width: 768px) {
    flex-direction: column;
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

const FileName = styled.div`
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #666;
`;

const ResourcesContainer = styled.div`
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  background-color: #f9f9f9;
`;

const ResourceItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: white;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  border: 1px solid #e0e0e0;
`;

const ResourceName = styled.div`
  font-weight: 500;
  flex: 1;
`;

const ResourceUrl = styled.a`
  color: #1565c0;
  text-decoration: none;
  flex: 2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ResourceRemoveButton = styled.button`
  background: none;
  border: none;
  color: #c62828;
  cursor: pointer;
  padding: 0.25rem;
  
  &:hover {
    color: #b71c1c;
  }
`;

const ResourceInputGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  
  input {
    flex: 1;
  }
`;

const ResourceAddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1a237e;
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background-color: #0e1859;
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

export default AddLecture;
