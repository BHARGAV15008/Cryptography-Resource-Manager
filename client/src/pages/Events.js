import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { FaCalendarAlt, FaExclamationCircle } from 'react-icons/fa';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to safely format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Unknown';
    }
    
    return date.toLocaleDateString();
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if server is available first
        try {
          const healthCheck = await axios.get('/api/health');
          
          if (healthCheck.data.status === 'ok') {
            console.log('Server is available, fetching events');
            const response = await axios.get('/api/events');
            setEvents(response.data);
          } else {
            console.log('Server reported issues, using mock data');
            loadMockData();
          }
        } catch (serverError) {
          console.error('Server health check failed, using mock data:', serverError);
          loadMockData();
        }
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Mock data fallback function
  const loadMockData = () => {
    const mockEvents = [
      {
        _id: 1,
        title: 'International Cryptography Conference',
        date: new Date().toISOString(),
        time: '09:00-17:00',
        location: 'Virtual Event',
        organizerName: 'International Association for Cryptologic Research',
        eventType: 'Conference',
        description: 'Annual conference covering latest advances in cryptographic research.',
        thumbnail: 'https://via.placeholder.com/300x200?text=Crypto+Conference'
      },
      {
        _id: 2,
        title: 'Blockchain Security Workshop',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        time: '10:00-15:00',
        location: 'IIIT Delhi',
        organizerName: 'Cryptography Research Group',
        eventType: 'Workshop',
        description: 'Hands-on workshop exploring blockchain security mechanisms.',
        thumbnail: 'https://via.placeholder.com/300x200?text=Blockchain+Workshop'
      },
      {
        _id: 3,
        title: 'Post-Quantum Cryptography Symposium',
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        time: '13:00-18:00',
        location: 'Delhi Technical University',
        organizerName: 'IEEE Computer Society',
        eventType: 'Symposium',
        description: 'Discussion on the future of cryptography in the quantum computing era.',
        thumbnail: 'https://via.placeholder.com/300x200?text=Quantum+Crypto'
      }
    ];
    
    setEvents(mockEvents);
  };

  const categorizeEvents = () => {
    const now = new Date();
    const ongoing = [];
    const upcoming = [];
    const completed = [];

    events.forEach(event => {
      const eventDate = new Date(event.date);
      const [startTime, endTime] = (event.time || '').split('-');
      const eventStartTime = startTime ? new Date(`${event.date} ${startTime}`) : eventDate;
      const eventEndTime = endTime ? new Date(`${event.date} ${endTime}`) : eventDate;

      if (now >= eventStartTime && now <= eventEndTime) {
        ongoing.push(event);
      } else if (now < eventStartTime) {
        upcoming.push(event);
      } else {
        completed.push(event);
      }
    });

    return { ongoing, upcoming, completed };
  };

  const renderEventSection = (title, events) => (
    <SectionContainer>
      <SectionTitle>{title}</SectionTitle>
      <EventsGrid>
        {events.map(event => (
          <EventCard key={event._id}>
            <EventImage src={event.thumbnail || 'https://via.placeholder.com/300x200?text=Event'} alt={event.title} />
            <EventContent>
              <EventTitle>{event.title}</EventTitle>
              <EventInfo>
                <p><strong>Date:</strong> {formatDate(event.date)}</p>
                <p><strong>Time:</strong> {event.time || 'Not specified'}</p>
                <p><strong>Location:</strong> {event.location || 'Not specified'}</p>
                <p><strong>Organizer:</strong> {event.organizerName || 'Not specified'}</p>
                <p><strong>Event Type:</strong> {event.eventType || 'Not specified'}</p>
              </EventInfo>
              <EventDescription>{event.description || 'No description available'}</EventDescription>
            </EventContent>
          </EventCard>
        ))}
      </EventsGrid>
    </SectionContainer>
  );

  if (loading) return (
    <LoadingContainer>
      <Spinner />
      <LoadingText>Loading events...</LoadingText>
    </LoadingContainer>
  );

  if (error) return (
    <ErrorContainer>
      <FaExclamationCircle size={24} />
      <ErrorText>{error}</ErrorText>
    </ErrorContainer>
  );

  const { ongoing, upcoming, completed } = categorizeEvents();

  return (
    <EventsContainer>
      <EventsHeader>
        <h1>Cryptography Events</h1>
        <p>All cryptography events</p>
      </EventsHeader>

      {ongoing.length > 0 && renderEventSection('Ongoing Events', ongoing)}
      {upcoming.length > 0 && renderEventSection('Upcoming Events', upcoming)}
      {completed.length > 0 && renderEventSection('Completed Events', completed)}
      
      {ongoing.length === 0 && upcoming.length === 0 && completed.length === 0 && (
        <NoEventsContainer>
          <FaCalendarAlt size={64} />
          <h2>No Events Available</h2>
          <p>There are currently no events to display.</p>
        </NoEventsContainer>
      )}
    </EventsContainer>
  );
};

const EventsContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const EventsHeader = styled.div`
  text-align: center;
  margin-bottom: 3rem;

  h1 {
    font-size: 2.5rem;
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: 1rem;
  }

  p {
    color: ${({ theme }) => theme.colors.textLight};
    font-size: 1.2rem;
  }
`;

const EventsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  padding: 1rem;
`;

const EventCard = styled.div`
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;

  &:hover {
    transform: translateY(-5px);
  }
`;

const EventImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
`;

const EventContent = styled.div`
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const EventTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.colors.text};
`;

const EventInfo = styled.div`
  margin-bottom: 1rem;

  p {
    margin: 0.2rem 0;
  }
`;

const EventDescription = styled.p`
  color: ${({ theme }) => theme.colors.textLight};
  margin-bottom: 1.5rem;
  flex: 1;
`;

const SectionContainer = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border-radius: 15px;
  padding: 2rem;
  margin-bottom: 3rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 2rem;
  font-size: 2rem;
  text-align: center;
  padding-bottom: 1rem;
  border-bottom: 2px solid ${({ theme }) => theme.colors.primary};
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid ${({ theme }) => theme.colors.backgroundAlt};
  border-top-color: ${({ theme }) => theme.colors.primary};
  animation: spin 1s infinite linear;
  margin-bottom: 1rem;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.p`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 1.1rem;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: ${({ theme }) => theme.colors.error};
`;

const ErrorText = styled.p`
  margin-top: 1rem;
  font-size: 1.1rem;
`;

const NoEventsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;

  svg {
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: 1rem;
  }

  h2 {
    font-size: 1.5rem;
    color: ${({ theme }) => theme.colors.text};
    margin-bottom: 0.5rem;
  }

  p {
    color: ${({ theme }) => theme.colors.textLight};
  }
`;

export default Events;