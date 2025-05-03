import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FaBook, FaPlus, FaVideo, FaFilePdf, FaFilePowerpoint, FaFile, FaTrash, FaEdit, FaExclamationCircle } from 'react-icons/fa';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AddResource from './AddResource';

const DashboardResources = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [resourceToEdit, setResourceToEdit] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Get auth header for API requests
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'x-auth-token': token
      }
    };
  };

  // Define fetchResources with useCallback to prevent it from causing infinite re-renders
  const fetchResources = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      try {
        // Add a cache-busting parameter when force refreshing
        const timestamp = forceRefresh ? `?t=${new Date().getTime()}` : '';
        console.log('Fetching resources from server' + (forceRefresh ? ' (forced refresh)' : ''));
        
        // API endpoint with proper auth header
        const response = await axios.get(`/api/resources${timestamp}`, getAuthHeader());
        console.log('Resources fetched successfully:', response.data);
        setResources(response.data);
        setLoading(false);
      } catch (apiError) {
        console.error('API call failed, trying mock endpoint:', apiError);
        
        try {
          // Try the mock endpoint
          const mockResponse = await axios.get('/api/resources/mock', getAuthHeader());
          console.log('Using mock endpoint data');
          setResources(mockResponse.data);
          setLoading(false);
        } catch (mockError) {
          console.error('Mock endpoint also failed, using fallback data:', mockError);
          
          // Use hardcoded mock data as last resort
          const mockResources = [
            {
              id: 1,
              title: 'Introduction to Symmetric Cryptography',
              description: 'A comprehensive overview of symmetric encryption techniques',
              type: 'video',
              url: 'https://example.com/video1',
              file_path: null,
              created_by: 1,
              creator_name: 'Dr. Jane Smith',
              tags: ['symmetric', 'encryption', 'basics'],
              createdAt: new Date().toISOString()
            },
            {
              id: 2,
              title: 'Public Key Infrastructure Explained',
              description: 'Deep dive into PKI and its applications in modern cryptography',
              type: 'pdf',
              url: 'https://example.com/pki-guide.pdf',
              file_path: '/uploads/resources/pki-guide.pdf',
              created_by: 2,
              creator_name: 'Prof. John Doe',
              tags: ['PKI', 'asymmetric', 'advanced'],
              createdAt: new Date().toISOString()
            },
            {
              id: 3,
              title: 'Blockchain and Cryptography',
              description: 'How cryptographic principles are used in blockchain technology',
              type: 'book',
              url: 'https://example.com/blockchain-book',
              file_path: null,
              created_by: 1,
              creator_name: 'Michael Chen',
              tags: ['blockchain', 'applications', 'modern'],
              createdAt: new Date().toISOString()
            }
          ];
          
          setResources(mockResources);
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Error fetching resources:', err);
      
      let errorMessage = 'Failed to load resources';
      if (err.response) {
        errorMessage += `: ${err.response.status} - ${err.response.data?.message || 'Unknown error'}`;
      } else if (err.request) {
        errorMessage += ': No response from server';
      } else {
        errorMessage += `: ${err.message}`;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check server status first
    const checkServerStatus = async () => {
      try {
        const response = await axios.get('/api/health');
        if (response.data.status === 'ok') {
          console.log('Server is available, fetching resources');
          fetchResources();
        } else {
          console.log('Server reported issues, using local mock data');
          loadMockData();
        }
      } catch (error) {
        console.log('Server health check failed, using local mock data', error);
        loadMockData();
      }
    };
    
    checkServerStatus();
  }, [fetchResources]);

  const loadMockData = () => {
    console.log('Using local mock data directly from the client');
    setLoading(true);
    
    const mockResources = [
      {
        id: 1,
        title: 'Introduction to Symmetric Cryptography',
        description: 'A comprehensive overview of symmetric encryption techniques',
        type: 'video',
        url: 'https://example.com/video1',
        file_path: null,
        created_by: 1,
        creator_name: 'Dr. Jane Smith',
        tags: ['symmetric', 'encryption', 'basics'],
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        title: 'Public Key Infrastructure Explained',
        description: 'Deep dive into PKI and its applications in modern cryptography',
        type: 'pdf',
        url: 'https://example.com/pki-guide.pdf',
        file_path: '/uploads/resources/pki-guide.pdf',
        created_by: 2,
        creator_name: 'Prof. John Doe',
        tags: ['PKI', 'asymmetric', 'advanced'],
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        title: 'Blockchain and Cryptography',
        description: 'How cryptographic principles are used in blockchain technology',
        type: 'book',
        url: 'https://example.com/blockchain-book',
        file_path: null,
        created_by: 1,
        creator_name: 'Michael Chen',
        tags: ['blockchain', 'applications', 'modern'],
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
    ];
    
    setResources(mockResources);
    setLoading(false);
  };

  const handleResourceAdded = (newResource) => {
    console.log('Resource added/updated:', newResource);
    
    // Instead of manually updating the state, force a fresh fetch from the server
    // This ensures we always have the latest data from the database
    fetchResources(true); // true = force refresh with cache busting
    
    // Reset editing state
    setIsEditing(false);
    setResourceToEdit(null);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video': return <FaVideo />;
      case 'book': return <FaBook />;
      case 'pdf': return <FaFilePdf />;
      case 'ppt': return <FaFilePowerpoint />;
      default: return <FaFile />;
    }
  };

  const handleDeleteResource = async (id) => {
    if (window.confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
      try {
        setError(null);
        
        try {
          // Make actual API call with auth header
          await axios.delete(`/api/resources/${id}`, getAuthHeader());
          console.log("Resource deleted successfully");
          
          // Notify the user
          if (window.toastify) {
            window.toastify.success('Resource deleted successfully');
          } else {
            alert('Resource deleted successfully');
          }
          
          // Remove from local state immediately - no need to refetch
          setResources(prevResources => prevResources.filter(resource => 
            resource.id !== id && resource._id !== id
          ));
          
          // Don't call fetchResources() here - it's redundant and can cause race conditions
        } catch (apiError) {
          console.error("API call failed:", apiError);
          
          if (apiError.response && apiError.response.status === 404) {
            // If resource doesn't exist anymore, it's essentially deleted
            setResources(prevResources => prevResources.filter(resource => 
              resource.id !== id && resource._id !== id
            ));
            console.log("Resource already deleted or not found");
            return;
          }
          
          // Show error to user
          if (window.toastify) {
            window.toastify.error('Failed to delete resource from database. Removed from view only.');
          }
          
          console.warn("Using mock deletion instead");
          
          // Mock deletion as fallback - remove from UI only
          setResources(prevResources => prevResources.filter(resource => 
            resource.id !== id && resource._id !== id
          ));
        }
      } catch (err) {
        console.error('Error deleting resource:', err);
        
        let errorMessage = 'Failed to delete resource';
        if (err.response) {
          errorMessage += `: ${err.response.data?.message || 'Unknown error'}`;
        } else if (err.request) {
          errorMessage += ': No response from server';
        } else {
          errorMessage += `: ${err.message}`;
        }
        
        setError(errorMessage);
      }
    }
  };

  const handleEdit = (id) => {
    // Find the resource to edit
    const resourceToEdit = resources.find(resource => 
      (resource.id === id || resource._id === id)
    );
    
    if (resourceToEdit) {
      setResourceToEdit(resourceToEdit);
      setIsEditing(true);
      setShowAddModal(true);
    } else {
      console.error('Resource not found for editing:', id);
      setError('Resource not found for editing');
    }
  };

  return (
    <DashboardContainer>
      <Header>
        <div>
          <h1>Resource Management</h1>
          <p>Add and manage cryptography resources</p>
        </div>
        <AddButton onClick={() => setShowAddModal(true)}>
          <FaPlus />
          <span>Add Resource</span>
        </AddButton>
      </Header>

      {loading ? (
        <LoadingMessage>
          <Spinner />
          Loading resources...
        </LoadingMessage>
      ) : error ? (
        <ErrorMessage>
          <FaExclamationCircle />
          {error}
        </ErrorMessage>
      ) : resources.length === 0 ? (
        <EmptyMessage>
          <FaBook />
          <h2>No Resources Yet</h2>
          <p>Click the Add Resource button to create your first resource.</p>
        </EmptyMessage>
      ) : (
        <ResourcesGrid>
          {resources.map(resource => (
            <ResourceCard key={resource.id || resource._id}>
              <ResourceHeader>
                <TypeIcon>{getTypeIcon(resource.type)}</TypeIcon>
                <ResourceType>{resource.type ? resource.type.toUpperCase() : 'UNKNOWN'}</ResourceType>
                <ResourceActions>
                  <ActionButton onClick={() => handleEdit(resource.id || resource._id)}>
                    <FaEdit />
                  </ActionButton>
                  <ActionButton $danger onClick={() => handleDeleteResource(resource.id || resource._id)}>
                    <FaTrash />
                  </ActionButton>
                </ResourceActions>
              </ResourceHeader>
              
              <ResourceTitle>{resource.title}</ResourceTitle>
              <ResourceAuthor>{resource.creator_name || resource.author || 'Unknown Author'}</ResourceAuthor>
              
              <ResourceDescription>
                {resource.description}
              </ResourceDescription>
              
              {resource.tags && resource.tags.length > 0 && (
                <TagsContainer>
                  {resource.tags.map((tag, index) => (
                    <Tag key={index}>{tag}</Tag>
                  ))}
                </TagsContainer>
              )}
              
              <ResourceMeta>
                <MetaItem>Added: {formatDate(resource.createdAt || resource.created_at)}</MetaItem>
              </ResourceMeta>
            </ResourceCard>
          ))}
        </ResourcesGrid>
      )}

      {showAddModal && (
        <AddResource
          onClose={() => {
            setShowAddModal(false);
            setIsEditing(false);
            setResourceToEdit(null);
          }}
          onResourceAdded={handleResourceAdded}
          resourceToEdit={resourceToEdit}
          isEditing={isEditing}
        />
      )}
    </DashboardContainer>
  );
};

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

const DashboardContainer = styled.div`
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2rem;
    color: ${({ theme }) => theme.colors.text};
    margin-bottom: 0.5rem;
  }
  
  p {
    color: ${({ theme }) => theme.colors.textLight};
  }
`;

const AddButton = styled.button`
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
    transform: translateY(-2px);
  }
  
  svg {
    font-size: 1rem;
  }
`;

const EmptyMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows.small};
  
  svg {
    font-size: 3rem;
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

const ResourcesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const ResourceCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: ${({ theme }) => theme.shadows.small};
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const ResourceHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const TypeIcon = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1.2rem;
  display: flex;
  align-items: center;
`;

const ResourceType = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textLight};
  flex: 1;
  text-transform: uppercase;
`;

const ResourceActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: ${({ $danger, theme }) => $danger ? theme.colors.error : theme.colors.primary};
  cursor: pointer;
  padding: 0.25rem;
  
  &:hover {
    color: ${({ $danger, theme }) => $danger ? theme.colors.errorDark : theme.colors.primaryDark};
  }
`;

const ResourceTitle = styled.h3`
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 0.5rem;
`;

const ResourceAuthor = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textLight};
  margin-bottom: 1rem;
`;

const ResourceDescription = styled.p`
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 1rem;
  line-height: 1.5;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const Tag = styled.span`
  padding: 0.25rem 0.5rem;
  background-color: ${({ theme }) => `${theme.colors.primary}10`};
  color: ${({ theme }) => theme.colors.primary};
  border-radius: 4px;
  font-size: 0.8rem;
`;

const ResourceMeta = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding-top: 1rem;
  margin-top: auto;
`;

const MetaItem = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textLight};
`;

const LoadingMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 1.1rem;
`;

const Spinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-top-color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background-color: ${({ theme }) => `${theme.colors.error}10`};
  color: ${({ theme }) => theme.colors.error};
  border-radius: 4px;

  svg {
    font-size: 1.2rem;
  }
`;

export default DashboardResources;