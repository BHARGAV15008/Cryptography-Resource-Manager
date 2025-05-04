import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FaCalendarAlt, FaMapMarkerAlt, FaBuilding, FaTimes, FaUpload, FaImage } from 'react-icons/fa';
import axios from 'axios';

const AddEvent = ({ onClose, onEventAdded, onEventUpdated, isEditing = false, eventToEdit = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    organizerName: '',
    eventType: 'workshop',
    imageUrl: '',
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Load event data if editing
  useEffect(() => {
    if (isEditing && eventToEdit) {
      // Format dates for input fields (YYYY-MM-DDTHH:MM)
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
      };

      setFormData({
        title: eventToEdit.title || '',
        description: eventToEdit.description || '',
        startDate: formatDateForInput(eventToEdit.startDate),
        endDate: formatDateForInput(eventToEdit.endDate),
        location: eventToEdit.location || '',
        organizerName: eventToEdit.organizerName || '',
        eventType: eventToEdit.eventType || 'workshop',
        imageUrl: eventToEdit.imageUrl || '',
      });

      if (eventToEdit.imageUrl) {
        setPreviewUrl(eventToEdit.imageUrl);
      }
    }
  }, [isEditing, eventToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setFormData(prev => ({
        ...prev,
        imageUrl: '' // Clear direct URL when file is selected
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      let imageUrl = formData.imageUrl;

      if (selectedImage) {
        // Create FormData for image upload
        const imageData = new FormData();
        imageData.append('image', selectedImage);

        // Upload image first
        const uploadResponse = await axios.post('/api/upload', imageData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        imageUrl = uploadResponse.data.url;
      }

      // Create event with image URL
      const eventData = {
        ...formData,
        imageUrl
      };

      console.log('Submitting event data:', eventData);

      // Make sure we're using the correct server URL (port 5001)
      const API_BASE_URL = 'http://localhost:5001';

      try {
        if (isEditing && eventToEdit && eventToEdit.id) {
          console.log(`Updating event with ID: ${eventToEdit.id}`);
          console.log('Event data being sent:', eventData);
          
          // Add the authorization header for protected routes
          const token = localStorage.getItem('token');
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          
          const response = await axios.put(
            `${API_BASE_URL}/api/events/${eventToEdit.id}`, 
            eventData,
            { headers }
          );
          
          console.log('Event updated successfully:', response.data);
          onEventUpdated(response.data);
        } else {
          console.log('Creating new event');
          const response = await axios.post(`${API_BASE_URL}/api/events`, eventData);
          console.log('Event created successfully:', response.data);
          onEventAdded(response.data);
        }
        onClose();
      } catch (apiError) {
        console.error('API error:', apiError);
        const errorMessage = apiError.response?.data?.error || apiError.response?.data?.message || apiError.message || 'Failed to create event';
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Error in form submission:', err);
      setError('Failed to process form: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal>
      <ModalContent>
        <ModalHeader>
          <h2>{isEditing ? 'Edit Event' : 'Add New Event'}</h2>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Event Title *</Label>
            <Input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter event title"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Description *</Label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter event description"
              required
              rows={4}
            />
          </FormGroup>

          <FormRow>
            <FormGroup>
              <Label>Start Date *</Label>
              <Input
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>End Date *</Label>
              <Input
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
            </FormGroup>
          </FormRow>

          <FormGroup>
            <Label>Location *</Label>
            <Input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter event location"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Organizer Name *</Label>
            <Input
              type="text"
              name="organizerName"
              value={formData.organizerName}
              onChange={handleChange}
              placeholder="Enter organizer name"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Event Type *</Label>
            <Select
              name="eventType"
              value={formData.eventType}
              onChange={handleChange}
              required
            >
              <option value="workshop">Workshop</option>
              <option value="conference">Conference</option>
              <option value="hackathon">Hackathon</option>
              <option value="seminar">Seminar</option>
              <option value="webinar">Webinar</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Event Image</Label>
            <ImageUploadContainer>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
              <UploadButton type="button" onClick={() => fileInputRef.current.click()}>
                <FaUpload />
                <span>Upload Image</span>
              </UploadButton>
              {!previewUrl && (
                <Input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  placeholder="Or enter image URL"
                />
              )}
            </ImageUploadContainer>
            {previewUrl && (
              <ImagePreviewContainer>
                <ImagePreview src={previewUrl} alt="Preview" />
                <RemoveImageButton onClick={() => {
                  setPreviewUrl('');
                  setSelectedImage(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}>
                  <FaTimes />
                </RemoveImageButton>
              </ImagePreviewContainer>
            )}
          </FormGroup>

          <ButtonGroup>
            <CancelButton type="button" onClick={onClose}>
              Cancel
            </CancelButton>
            <SubmitButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Event' : 'Create Event')}
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
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h2 {
    margin: 0;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textLight};
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const Label = styled.label`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Textarea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
`;

const SubmitButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }
  
  &:disabled {
    background-color: ${({ theme }) => theme.colors.gray};
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background-color: white;
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.backgroundAlt};
  }
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.error};
  background-color: ${({ theme }) => theme.colors.error}20;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
`;

const ImageUploadContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const UploadButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const ImagePreviewContainer = styled.div`
  position: relative;
  display: inline-block;
  margin-top: 1rem;
`;

const ImagePreview = styled.img`
  max-width: 200px;
  max-height: 200px;
  border-radius: 4px;
  object-fit: cover;
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.error};
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.errorDark};
  }
  
  svg {
    font-size: 12px;
  }
`;

export default AddEvent;