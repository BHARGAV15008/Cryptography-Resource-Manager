import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaCalendarAlt, FaPlus, FaExclamationCircle, FaEdit, FaTrash } from 'react-icons/fa';
import AddEvent from './AddEvent';
import axios from 'axios';

// Event image fallback component
const EventImageFallback = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 8px 8px 0 0;
  width: 100%;
  height: 200px;
  color: #666;

  svg {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: #888;
  }

  p {
    font-size: 1.2rem;
    font-weight: 500;
    margin: 0;
  }
`;

const DashboardEvents = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);

  // Function to get auth header for API requests
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Make sure we're using the correct server URL (port 5001)
        const API_BASE_URL = 'http://localhost:5001';
        
        console.log('Attempting to fetch events from server...');
        try {
          // Make direct API call to fetch events
          const response = await axios.get(`${API_BASE_URL}/api/events`, getAuthHeader());
          console.log('Events API response:', response);
          
          if (response.data && Array.isArray(response.data)) {
            // Only include events that have a valid ID
            const validEvents = response.data.filter(event => event && event.id);
            console.log(`Found ${validEvents.length} valid events`);
            
            if (validEvents.length > 0) {
              // Process events to ensure they have valid properties
              // Use a data URI for the default image to avoid network requests
              const placeholderImageDataURI = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTkiPk5vIEltYWdlIEF2YWlsYWJsZTwvdGV4dD48L3N2Zz4=';
              
              const processedEvents = validEvents.map(event => ({
                ...event,
                id: event.id,
                title: event.title || 'Untitled Event',
                description: event.description || 'No description available',
                startDate: event.startDate || new Date(),
                endDate: event.endDate || new Date(),
                location: event.location || 'TBD',
                imageUrl: event.imageUrl || placeholderImageDataURI,
                organizerName: event.organizerName || 'Unknown Organizer'
              }));
              
              setEvents(processedEvents);
              console.log('Events loaded successfully:', processedEvents);
            } else {
              console.log('No valid events found, showing empty state');
            }
          } else {
            console.error('Invalid response format:', response.data);
            setError('Invalid response format from server');
          }
        } catch (apiError) {
          console.error('API call failed:', apiError);
          setError(`Failed to fetch events: ${apiError.message}`);
        }
      } catch (err) {
        console.error('Error in fetchEvents:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Mock data fallback
  const loadMockData = () => {
    const mockEvents = [
      {
        id: 1,
        title: 'International Cryptography Conference',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Virtual Event',
        organizerName: 'International Association for Cryptologic Research',
        eventType: 'Conference',
        description: 'Annual conference covering latest advances in cryptographic research.',
        imageUrl: 'https://via.placeholder.com/300x200?text=Crypto+Conference'
      },
      {
        id: 2,
        title: 'Blockchain Security Workshop',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'IIIT Delhi',
        organizerName: 'Cryptography Research Group',
        eventType: 'Workshop',
        description: 'Hands-on workshop exploring blockchain security mechanisms.',
        imageUrl: 'https://via.placeholder.com/300x200?text=Blockchain+Workshop'
      }
    ];
    
    setEvents(mockEvents);
  };

  const handleEventAdded = (newEvent) => {
    setEvents(prev => [...prev, newEvent]);
  };

  const handleEventUpdated = (updatedEvent) => {
    setEvents(prev => 
      prev.map(event => 
        event.id === updatedEvent.id ? updatedEvent : event
      )
    );
  };

  const handleEdit = (event) => {
    setEventToEdit(event);
    setIsEditing(true);
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (!id) {
      console.error("Cannot delete event with undefined ID");
      setError("Cannot delete event: ID is missing");
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        setError(null);
        
        // Make sure we're using the correct server URL (port 5001)
        const API_BASE_URL = 'http://localhost:5001';
        
        try {
          console.log(`Deleting event with ID: ${id}`);
          await axios.delete(`${API_BASE_URL}/api/events/${id}`, getAuthHeader());
          console.log("Event deleted successfully");
          
          // Notify the user
          if (window.toastify) {
            window.toastify.success('Event deleted successfully');
          } else {
            alert('Event deleted successfully');
          }
          
          // Remove from local state
          setEvents(prevEvents => prevEvents.filter(event => event.id !== id));
        } catch (apiError) {
          console.error("API call failed:", apiError);
          
          if (apiError.response && apiError.response.status === 404) {
            // If event doesn't exist anymore, it's essentially deleted
            setEvents(prevEvents => prevEvents.filter(event => event.id !== id));
            console.log("Event already deleted or not found");
            return;
          }
          
          // Show error to user
          if (window.toastify) {
            window.toastify.error('Failed to delete event from database. Removed from view only.');
          } else {
            alert('Failed to delete event from database. Removed from view only.');
          }
          
          // Still remove from local state for better UX
          setEvents(prevEvents => prevEvents.filter(event => event.id !== id));
        }
      } catch (error) {
        console.error("Error deleting event:", error);
        setError("Failed to delete event");
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return 'Unknown';
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Unknown';
    }
    
    return date.toLocaleString();
  };

  const handleImageError = (e) => {
    // Prevent infinite callbacks
    e.target.onerror = null;
    
    // Don't log errors - this was causing console spam
    // Just silently replace with a data URI placeholder
    
    // Use a data URI for the placeholder image instead of a file path
    // This ensures we don't make another request that might fail
    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTkiPk5vIEltYWdlIEF2YWlsYWJsZTwvdGV4dD48L3N2Zz4=';
  };

  return (
    <DashboardContainer>
      <Header>
        <div>
          <h1>Events Management</h1>
          <p>View and manage cryptography events</p>
        </div>
        <AddButton onClick={() => setShowAddModal(true)}>
          <FaPlus />
          <span>Add Event</span>
        </AddButton>
      </Header>

      {error && (
        <ErrorMessage>
          <FaExclamationCircle />
          <span>{error}</span>
        </ErrorMessage>
      )}

      {loading ? (
        <LoadingMessage>Loading events...</LoadingMessage>
      ) : events.length === 0 ? (
        <EmptyState>
          <h3>No events found</h3>
          <p>There are no cryptography events available at the moment.</p>
          <AddButton onClick={() => setShowAddModal(true)}>
            <FaPlus />
            <span>Add Your First Event</span>
          </AddButton>
        </EmptyState>
      ) : (
        <EventsGrid>
          {events.map(event => (
            <EventCard key={event.id}>
              {event.imageUrl ? (
                <EventImage 
                  src={event.imageUrl} 
                  alt={event.title} 
                  onError={handleImageError}
                />
              ) : (
                <EventImageFallback>
                  <FaCalendarAlt />
                  <p>No image available</p>
                </EventImageFallback>
              )}
              <EventContent>
                <EventTypeTag eventType={event.eventType}>
                  {event.eventType || 'Event'}
                </EventTypeTag>
                <EventTitle>{event.title}</EventTitle>
                <EventMeta>
                  <EventDate>
                    <strong>Start:</strong> {formatDate(event.startDate)}
                  </EventDate>
                  <EventDate>
                    <strong>End:</strong> {formatDate(event.endDate)}
                  </EventDate>
                </EventMeta>
                <EventDescription>{event.description || 'No description available'}</EventDescription>
                <EventLocation>
                  <strong>Location:</strong> {event.location || 'Not specified'}
                </EventLocation>
                <EventOrganizer>
                  <strong>Organizer:</strong> {event.organizerName || 'Not specified'}
                </EventOrganizer>
                <EditButton onClick={() => handleEdit(event)}>
                  <FaEdit />
                  <span>Edit</span>
                </EditButton>
                <DeleteButton 
                  onClick={() => event.id ? handleDelete(event.id) : setError("Cannot delete: Event ID is missing")}
                  disabled={!event.id}
                >
                  <FaTrash />
                  <span>Delete</span>
                </DeleteButton>
              </EventContent>
            </EventCard>
          ))}
        </EventsGrid>
      )}

      {showAddModal && (
        <AddEvent
          onClose={() => {
            setShowAddModal(false);
            setIsEditing(false);
            setEventToEdit(null);
          }}
          onEventAdded={handleEventAdded}
          onEventUpdated={handleEventUpdated}
          isEditing={isEditing}
          eventToEdit={eventToEdit}
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

const AddButton = styled.button`
  display: flex;
  align-items: center;
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  
  &:hover {
    background-color: #45a049;
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
  
  h3 {
    margin-bottom: 0.5rem;
  }
  
  p {
    margin-bottom: 1.5rem;
    color: #666;
  }
`;

const EventsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
`;

const EventCard = styled.div`
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const EventImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px 8px 0 0;
`;

const EventContent = styled.div`
  padding: 1.5rem;
  position: relative;
`;

const EventTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
`;

const EventMeta = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  font-size: 0.9rem;
`;

const EventDate = styled.div`
  color: #666;
`;

const EventDescription = styled.p`
  margin-bottom: 1rem;
  color: #333;
  font-size: 0.9rem;
`;

const EventLocation = styled.div`
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
`;

const EventOrganizer = styled.div`
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
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
  margin-right: 0.5rem;
  
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
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  
  svg {
    margin-right: 0.3rem;
  }
`;

// Event type tag with different colors based on event type
const EventTypeTag = styled.div`
  display: inline-block;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.75rem;
  color: white;
  background-color: ${props => {
    switch (props.eventType?.toLowerCase()) {
      case 'conference':
        return '#2196f3'; // Blue
      case 'workshop':
        return '#4caf50'; // Green
      case 'seminar':
        return '#ff9800'; // Orange
      case 'webinar':
        return '#9c27b0'; // Purple
      case 'hackathon':
        return '#f44336'; // Red
      case 'meetup':
        return '#00bcd4'; // Cyan
      default:
        return '#757575'; // Grey
    }
  }};
`;

export default DashboardEvents;
