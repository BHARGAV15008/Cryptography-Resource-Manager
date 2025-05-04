import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { FaArrowLeft, FaVideo, FaFileAlt, FaBook, FaQuoteLeft, FaExternalLinkAlt, FaDownload, FaBookmark, FaRegBookmark, FaCopy, FaFilePdf, FaFilePowerpoint, FaSync } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const ResourceDetail = () => {
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  
  const { id } = useParams();
  const { user } = useAuth();
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
  
  // Use useCallback to memoize the fetchResource function
  const fetchResource = useCallback(async () => {
    try {
      if (loading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      
      try {
        const response = await axios.get(`/api/resources/${id}`, getAuthHeader());
        if (!response.data) {
          // Resource doesn't exist
          setError('Resource not found or has been deleted');
          setLoading(false);
          setRefreshing(false);
          return;
        }
        setResource(response.data);
        
        // Check if resource is bookmarked by the user
        if (user) {
          const bookmarksResponse = await axios.get('/api/bookmarks', getAuthHeader());
          
          const isBookmarked = bookmarksResponse.data.some(
            bookmark => bookmark.resourceId === id
          );
          
          setIsBookmarked(isBookmarked);
        }
      } catch (apiError) {
        console.error('API call failed:', apiError);
        
        // Check if error is 404 (resource not found)
        if (apiError.response && apiError.response.status === 404) {
          setError('Resource not found or has been deleted');
          setLoading(false);
          setRefreshing(false);
          return;
        }
        
        // Create mock resource as fallback only if it's not a 404 error
        const mockResource = {
          id: id,
          title: 'Example Resource',
          description: 'This is a mock resource created because the API request failed.',
          type: 'pdf',
          author: 'System',
          url: 'https://example.com/resource.pdf',
          tags: ['mock', 'example'],
          createdAt: new Date().toISOString()
        };
        
        setResource(mockResource);
      }
      
      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      console.error('Failed to fetch resource details:', err);
      
      let errorMessage = 'Failed to fetch resource details';
      if (err.response) {
        // If resource is not found (404), show a specific message
        if (err.response.status === 404) {
          errorMessage = 'Resource not found or has been deleted';
        } else {
          errorMessage += `: ${err.response.status} - ${err.response.data?.message || 'Unknown error'}`;
        }
      } else if (err.request) {
        errorMessage += ': No response from server';
      } else {
        errorMessage += `: ${err.message}`;
      }
      
      setError(errorMessage);
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, user, loading]);

  useEffect(() => {
    fetchResource();
    
    // Add visibility change listener to refresh data when user returns to the page
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchResource();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchResource]);
  
  const handleRefresh = () => {
    fetchResource();
  };

  const fetchRelatedResources = useCallback(async () => {
    if (!resource) return;
    
    try {
      // Get resources from the main endpoint with type filter through query parameter
      if (resource.type) {
        const response = await axios.get(`/api/resources?type=${resource.type}`, getAuthHeader());
        // Filter out the current resource
        const filteredResources = response.data
          .filter(r => r.id !== parseInt(id))
          .slice(0, 3);
        setRelatedResources(filteredResources);
      } else {
        // If resource has no type, just get the latest resources
        const response = await axios.get('/api/resources', getAuthHeader());
        const filteredResources = response.data
          .filter(r => r.id !== parseInt(id))
          .slice(0, 3);
        setRelatedResources(filteredResources);
      }
    } catch (err) {
      console.error('API call failed:', err);
      // Use mock data if API fails
      useLocalMockData();
    }
  }, [resource, id, getAuthHeader]);

  const handleBookmark = async () => {
    if (!user) return;
    
    try {
      if (isBookmarked) {
        // Remove bookmark
        await axios.delete(`/api/bookmarks/${id}`, getAuthHeader());
      } else {
        // Add bookmark
        await axios.post('/api/bookmarks', { resourceId: id }, getAuthHeader());
      }
      
      setIsBookmarked(!isBookmarked);
    } catch (err) {
      console.error('Failed to update bookmark', err);
    }
  };

  const handleDownload = () => {
    if (resource.url) {
      const link = document.createElement('a');
      link.href = resource.url;
      link.download = `${resource.title}${resource.type ? '.' + resource.type : ''}`;
      link.target = '_blank';
      link.click();
    }
  };

  const generateCitation = () => {
    // Generate citation in APA format
    const author = resource.author || 'Unknown Author';
    const year = new Date(resource.createdAt).getFullYear();
    const title = resource.title;
    const url = resource.url || '';
    
    return `${author}. (${year}). ${title}. Retrieved from ${url}`;
  };

  const handleCopyCitation = () => {
    const citation = generateCitation();
    
    navigator.clipboard.writeText(citation)
      .then(() => {
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy citation:', err);
      });
  };
  
  const getTypeIcon = (type) => {
    // If type is undefined or null, use default icon
    if (!type) return <FaFileAlt />;
    
    switch (type) {
      case 'video':
        return <FaVideo />;
      case 'note':
        return <FaFileAlt />;
      case 'book':
        return <FaBook />;
      case 'pdf':
        return <FaFilePdf />;
      case 'ppt':
        return <FaFilePowerpoint />;
      case 'citation':
        return <FaQuoteLeft />;
      default:
        return <FaFileAlt />;
    }
  };

  const handleDelete = async () => {
    if (!user || user.role !== 'admin') return;
    
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await axios.delete(`/api/resources/${id}`, getAuthHeader());
        // Redirect back to resources page after successful deletion
        navigate('/resources');
      } catch (err) {
        console.error('Failed to delete resource:', err);
        alert('Failed to delete resource. Please try again.');
      }
    }
  };
  
  if (loading) {
    return (
      <ResourceDetailContainer>
        <div className="container">
          <LoadingMessage>Loading resource details...</LoadingMessage>
        </div>
      </ResourceDetailContainer>
    );
  }
  
  if (error || !resource) {
    return (
      <ResourceDetailContainer>
        <div className="container">
          <ErrorMessage>{error || 'Resource not found'}</ErrorMessage>
          <BackLink to="/resources">
            <FaArrowLeft /> Back to Resources
          </BackLink>
        </div>
      </ResourceDetailContainer>
    );
  }
  
  return (
    <ResourceDetailContainer>
      <div className="container">
        <BackLinkContainer>
          <BackLink to="/resources">
            <FaArrowLeft /> Back to Resources
          </BackLink>
          <RefreshButton 
            onClick={handleRefresh} 
            disabled={refreshing || loading} 
            title="Refresh resource data"
          >
            <FaSync className={refreshing ? 'spinning' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </RefreshButton>
        </BackLinkContainer>
        
        <ResourceHeader>
          <ResourceType>
            {getTypeIcon(resource.type)}
            <span>{resource.type ? resource.type.charAt(0).toUpperCase() + resource.type.slice(1) : 'Unknown'}</span>
          </ResourceType>
          <ResourceTitle>{resource.title}</ResourceTitle>
          <ResourceMeta>
            <MetaItem>Added on {new Date(resource.createdAt).toLocaleDateString()}</MetaItem>
            {resource.author && <MetaItem>By {resource.author}</MetaItem>}
          </ResourceMeta>
        </ResourceHeader>
        
        <ResourceContent>
          <ResourceDescription>{resource.description}</ResourceDescription>
          
          {resource.content && (
            <ResourceSection>
              <SectionTitle>Content</SectionTitle>
              <ResourceText>{resource.content}</ResourceText>
            </ResourceSection>
          )}
          
          {resource.notes && (
            <ResourceSection>
              <SectionTitle>Notes</SectionTitle>
              <ResourceText>{resource.notes}</ResourceText>
            </ResourceSection>
          )}
          
          {resource.tags && resource.tags.length > 0 && (
            <ResourceSection>
              <SectionTitle>Tags</SectionTitle>
              <TagsContainer>
                {resource.tags.map((tag, index) => (
                  <Tag key={index}>{tag}</Tag>
                ))}
              </TagsContainer>
            </ResourceSection>
          )}
        </ResourceContent>
        
        <ResourceActions>
          {resource.url && (
            <ActionButton as="a" href={resource.url} target="_blank" rel="noopener noreferrer">
              <FaExternalLinkAlt /> Open Resource
            </ActionButton>
          )}
          
          {(resource.url || resource.fileUrl) && (
            <ActionButton onClick={handleDownload}>
              <FaDownload /> Download
            </ActionButton>
          )}
          
          <ActionButton onClick={handleCopyCitation}>
            <FaCopy /> {copyFeedback ? 'Citation Copied!' : 'Copy Citation'}
          </ActionButton>
          
          {user && (
            <BookmarkButton onClick={handleBookmark} $isBookmarked={isBookmarked}>
              {isBookmarked ? <FaBookmark /> : <FaRegBookmark />}
              {isBookmarked ? 'Bookmarked' : 'Bookmark'}
            </BookmarkButton>
          )}

          {user && user.role === 'admin' && (
            <DeleteButton onClick={handleDelete}>
              Delete Resource
            </DeleteButton>
          )}
        </ResourceActions>
      </div>
    </ResourceDetailContainer>
  );
};

const ResourceDetailContainer = styled.div`
  padding: 2rem 0;
`;

const LoadingMessage = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.textLight};
  padding: 3rem 0;
`;

const ErrorMessage = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.error};
  padding: 2rem 0;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 2rem;
  font-weight: 500;
  
  svg {
    margin-right: 0.5rem;
  }
  
  &:hover {
    text-decoration: underline;
  }
`;

const DeleteButton = styled.button`
  background-color: ${({ theme }) => theme.colors.error};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-left: auto;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.errorDark};
  }
`;

const ResourceHeader = styled.div`
  margin-bottom: 2rem;
`;

const ResourceType = styled.div`
  display: inline-flex;
  align-items: center;
  background-color: ${({ theme }) => `${theme.colors.primary}20`};
  color: ${({ theme }) => theme.colors.primary};
  padding: 0.5rem 1rem;
  border-radius: 5px;
  margin-bottom: 1rem;
  font-weight: 500;
  
  svg {
    margin-right: 0.5rem;
  }
`;

const ResourceTitle = styled.h1`
  font-size: 2.5rem;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 1rem;
`;

const ResourceMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  color: ${({ theme }) => theme.colors.textLight};
`;

const MetaItem = styled.span`
  font-size: 0.9rem;
`;

const ResourceContent = styled.div`
  margin-bottom: 2rem;
`;

const ResourceDescription = styled.p`
  font-size: 1.2rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  color: ${({ theme }) => theme.colors.text};
`;

const ResourceSection = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray};
`;

const ResourceText = styled.div`
  font-size: 1.1rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text};
  white-space: pre-line;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const Tag = styled.span`
  background-color: ${({ theme }) => theme.colors.gray};
  color: ${({ theme }) => theme.colors.text};
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
`;

const ResourceActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 1.5rem;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
    transform: translateY(-3px);
  }
`;

const BookmarkButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 1.5rem;
  background-color: ${({ $isBookmarked, theme }) => 
    $isBookmarked ? `${theme.colors.success}20` : 'transparent'};
  color: ${({ $isBookmarked, theme }) => 
    $isBookmarked ? theme.colors.success : theme.colors.primary};
  border: 2px solid ${({ $isBookmarked, theme }) => 
    $isBookmarked ? theme.colors.success : theme.colors.primary};
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${({ $isBookmarked, theme }) => 
      $isBookmarked ? `${theme.colors.success}30` : `${theme.colors.primary}10`};
    transform: translateY(-3px);
  }
`;

const BackLinkContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    text-decoration: underline;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .spinning {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export default ResourceDetail;