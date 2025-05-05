import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { FaPlus, FaSearch, FaFilter, FaVideo, FaFileAlt, FaBook, FaQuoteLeft, FaExternalLinkAlt, FaDownload, FaCopy, FaSync } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Resources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'all'
  });
  const [availableTags, setAvailableTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState({ id: null, copied: false });
  const [refreshing, setRefreshing] = useState(false);
  
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize filters from URL query parameters and update URL when filters change
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam) {
      setFilters(prev => ({ ...prev, type: typeParam }));
    }
  }, [searchParams]);
  
  // Update URL when filters change through the UI
  const updateUrlWithFilters = (newFilters) => {
    const params = {};
    if (newFilters.type && newFilters.type !== 'all') {
      params.type = newFilters.type;
    }
    setSearchParams(params, { replace: true });
  };
  
  // Forward declaration of fetchResources which will be defined below
  // This ensures it's in scope for the useEffect hook

  // Get auth header for API requests
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'x-auth-token': token
      }
    };
  };
  
  // Function to load mock data when server is unavailable
  const loadMockData = () => {
    console.log('Loading mock resource data');
    // Mock resource data
    const mockResources = [
      {
        id: 1,
        title: 'Introduction to Cryptography',
        description: 'A comprehensive introduction to cryptographic concepts',
        type: 'article',
        url: 'https://example.com/intro-crypto',
        tags: ['basics', 'encryption'],
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        title: 'Advanced Encryption Standards',
        description: 'Deep dive into AES encryption',
        type: 'video',
        url: 'https://example.com/aes-video',
        tags: ['encryption', 'advanced'],
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        title: 'Public Key Infrastructure',
        description: 'Understanding PKI and its applications',
        type: 'document',
        url: 'https://example.com/pki-doc',
        tags: ['security', 'certificates'],
        createdAt: new Date().toISOString()
      }
    ];
    
    setResources(mockResources);
    // Extract unique tags from mock resources
    const tags = [...new Set(mockResources.flatMap(resource => resource.tags))];
    setAvailableTags(tags);
    setLoading(false);
  };

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
    
    // This will refresh resources when user comes back to this page
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkServerStatus();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.key, searchParams]); // Add searchParams to the dependency array to react to URL changes

  const useLocalMockData = () => {
    console.log('Using local mock data directly from the client');
    setLoading(false);
    setRefreshing(false);
    
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
    
    // Extract unique tags from local mock resources
    const tags = new Set();
    mockResources.forEach(resource => {
      if (resource.tags && Array.isArray(resource.tags)) {
        resource.tags.forEach(tag => tags.add(tag));
      }
    });
    
    setAvailableTags(Array.from(tags));
  };

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setRefreshing(true);
      
      try {
        // Check if we have a type filter from URL parameters
        const typeParam = searchParams.get('type');
        // If we have a type parameter, update the filter state
        if (typeParam && typeParam !== 'all') {
          setFilters(prev => ({ ...prev, type: typeParam }));
        }
        
        // Use the same API endpoint as dashboard with auth header
        const response = await axios.get('/api/resources', getAuthHeader());
        let filteredData = response.data;
        
        // Apply type filter from URL if present
        if (typeParam && typeParam !== 'all') {
          filteredData = response.data.filter(resource => resource.type === typeParam);
        }
        
        setResources(filteredData);
        
        // Extract unique tags from resources
        const tags = new Set();
        response.data.forEach(resource => {
          if (resource.tags && Array.isArray(resource.tags)) {
            resource.tags.forEach(tag => tags.add(tag));
          }
        });
        
        setAvailableTags(Array.from(tags));
      } catch (err) {
        console.error('API call failed, trying mock endpoint:', err);
        
        try {
          // Try the mock endpoint
          const mockResponse = await axios.get('/api/resources/mock', getAuthHeader());
          console.log('Using mock endpoint data');
          setResources(mockResponse.data);
          
          // Extract unique tags from mock resources
          const tags = new Set();
          mockResponse.data.forEach(resource => {
            if (resource.tags && Array.isArray(resource.tags)) {
              resource.tags.forEach(tag => tags.add(tag));
            }
          });
          
          setAvailableTags(Array.from(tags));
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
          
          // Extract unique tags from local mock resources
          const tags = new Set();
          mockResources.forEach(resource => {
            if (resource.tags && Array.isArray(resource.tags)) {
              resource.tags.forEach(tag => tags.add(tag));
            }
          });
          
          setAvailableTags(Array.from(tags));
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
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getAuthHeader]);
  
  const handleRefresh = () => {
    fetchResources();
  };
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = {
      ...filters,
      [name]: value
    };
    setFilters(newFilters);
    
    // Update URL with new filters
    updateUrlWithFilters(newFilters);
  };
  
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  const getTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <FaVideo />;
      case 'note':
        return <FaFileAlt />;
      case 'book':
        return <FaBook />;
      case 'pdf':
        return <FaFileAlt />;
      case 'ppt':
        return <FaFileAlt />;
      case 'citation':
        return <FaQuoteLeft />;
      default:
        return <FaFileAlt />;
    }
  };

  const handleDownload = (resource) => {
    if (resource.url) {
      // For direct file downloads
      const link = document.createElement('a');
      link.href = resource.url;
      link.download = `${resource.title}.${resource.type}`;
      link.target = '_blank';
      link.click();
    }
  };

  const generateCitation = (resource) => {
    // Generate citation in APA format
    const author = resource.creator_name || resource.author || 'Unknown Author';
    const year = new Date(resource.createdAt).getFullYear();
    const title = resource.title;
    const url = resource.url || '';
    
    return `${author}. (${year}). ${title}. Retrieved from ${url}`;
  };

  const handleCopyCitation = (id) => {
    const resource = resources.find(r => (r.id || r._id) === id);
    const citation = generateCitation(resource);
    
    navigator.clipboard.writeText(citation)
      .then(() => {
        setCopyFeedback({ id, copied: true });
        setTimeout(() => setCopyFeedback({ id: null, copied: false }), 2000);
      })
      .catch(err => {
        console.error('Failed to copy citation:', err);
      });
  };
  
  const filteredResources = resources.filter(resource => {
    // Search term filter
    const matchesSearch = 
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Type filter
    const matchesType = filters.type === 'all' || resource.type === filters.type;
    
    return matchesSearch && matchesType;
  });
  
  return (
    <ResourcesContainer>
      <div className="container">
        <PageHeader>
          <PageTitle>Cryptographic Resources</PageTitle>
          <PageDescription>
            Explore and learn from our collection of cryptography resources
          </PageDescription>
        </PageHeader>
        
        <ControlsContainer>
          <SearchContainer>
            <SearchBar>
              <SearchIcon>
                <FaSearch />
              </SearchIcon>
              <SearchInput 
                type="text" 
                placeholder="Search resources..." 
                value={searchTerm}
                onChange={handleSearch}
              />
            </SearchBar>
          </SearchContainer>
          
          <ControlsActions>
            <RefreshButton 
              onClick={handleRefresh} 
              disabled={refreshing} 
              title="Refresh resources list"
            >
              <FaSync className={refreshing ? 'spinning' : ''} />
              <span>Refresh</span>
            </RefreshButton>
            
            <FilterButton onClick={toggleFilters}>
              <FaFilter />
              <span>Filters</span>
            </FilterButton>
            
            {user && user.role === 'admin' && (
              <AddButton as={Link} to="/resources/add">
                <FaPlus />
                <span>Add Resource</span>
              </AddButton>
            )}
          </ControlsActions>
        </ControlsContainer>
        
        {showFilters && (
          <FiltersContainer>
            <FilterGroup>
              <FilterLabel>Resource Type</FilterLabel>
              <FilterSelect 
                name="type" 
                value={filters.type} 
                onChange={handleFilterChange}
              >
                <option value="all">All Types</option>
                <option value="video">Videos</option>
                <option value="pdf">PDFs</option>
                <option value="book">Books</option>
                <option value="note">Notes</option>
                <option value="ppt">Presentations</option>
                <option value="article">Articles</option>
              </FilterSelect>
            </FilterGroup>
          </FiltersContainer>
        )}
        
        {loading ? (
          <LoadingMessage>Loading resources...</LoadingMessage>
        ) : error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : filteredResources.length === 0 ? (
          <EmptyState>
            <EmptyTitle>No resources found</EmptyTitle>
            <EmptyDescription>
              {searchTerm || filters.type !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'No resources have been added yet.'}
            </EmptyDescription>
            {user && user.role === 'admin' && (
              <AddResourceLink to="/resources/add">Add Resource</AddResourceLink>
            )}
          </EmptyState>
        ) : (
          <ResourcesGrid>
            {filteredResources.map(resource => (
              <ResourceCard key={resource.id || resource._id}>
                <ResourceType>
                  {getTypeIcon(resource.type)}
                  <span>{resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}</span>
                </ResourceType>
                <ResourceTitle to={`/resources/${resource.id || resource._id}`}>
                  {resource.title}
                </ResourceTitle>
                <ResourceDescription>
                  {resource.description.length > 150
                    ? `${resource.description.substring(0, 150)}...`
                    : resource.description}
                </ResourceDescription>
                
                {resource.tags && resource.tags.length > 0 && (
                  <TagsContainer>
                    {resource.tags.slice(0, 3).map((tag, index) => (
                      <Tag key={index}>{tag}</Tag>
                    ))}
                    {resource.tags.length > 3 && (
                      <TagCount>+{resource.tags.length - 3}</TagCount>
                    )}
                  </TagsContainer>
                )}
                
                <ResourceFooter>
                  <ResourceMeta>
                    <MetaItem>Added on {new Date(resource.createdAt).toLocaleDateString()}</MetaItem>
                  </ResourceMeta>
                  
                  <ActionButtons>
                    {(resource.type === 'pdf' || resource.type === 'book' || resource.url) && (
                      <ActionButton title="Download" onClick={() => handleDownload(resource)}>
                        <FaDownload />
                      </ActionButton>
                    )}
                    
                    <ActionButton 
                      title={copyFeedback.id === (resource.id || resource._id) && copyFeedback.copied ? "Copied!" : "Copy Citation"}
                      onClick={() => handleCopyCitation(resource.id || resource._id)}
                      active={copyFeedback.id === (resource.id || resource._id) && copyFeedback.copied}
                    >
                      <FaCopy />
                      {copyFeedback.id === (resource.id || resource._id) && copyFeedback.copied && (
                        <CopiedTooltip>Copied!</CopiedTooltip>
                      )}
                    </ActionButton>
                    
                    {resource.url && (
                      <ActionButton as="a" href={resource.url} target="_blank" rel="noopener noreferrer" title="Open Link">
                        <FaExternalLinkAlt />
                      </ActionButton>
                    )}
                  </ActionButtons>
                </ResourceFooter>
              </ResourceCard>
            ))}
          </ResourcesGrid>
        )}
      </div>
    </ResourcesContainer>
  );
};

const ResourcesContainer = styled.div`
  padding: 2rem 0;
`;

const PageHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 0.5rem;
`;

const PageDescription = styled.p`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 1.1rem;
`;

const ControlsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
`;

const SearchContainer = styled.div`
  flex: 1;
  min-width: 250px;
`;

const SearchBar = styled.div`
  position: relative;
`;

const SearchIcon = styled.div`
  position: absolute;
  top: 50%;
  left: 1rem;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.textLight};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.8rem 1rem 0.8rem 3rem;
  border: 1px solid ${({ theme }) => theme.colors.gray};
  border-radius: 5px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s ease;
  
  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ControlsActions = styled.div`
  display: flex;
  gap: 1rem;
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 1.5rem;
  background-color: transparent;
  color: ${({ theme }) => theme.colors.primary};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${({ theme }) => `${theme.colors.primary}10`};
  }
`;

const AddButton = styled.button`
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
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding: 1.5rem;
  background-color: ${({ theme }) => `${theme.colors.gray}20`};
  border-radius: 5px;
  margin-bottom: 2rem;
`;

const FilterGroup = styled.div`
  flex: 1;
  min-width: 200px;
`;

const FilterLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const FilterSelect = styled.select`
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.gray};
  border-radius: 5px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s ease;
  
  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
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

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 0;
`;

const EmptyTitle = styled.h2`
  font-size: 1.8rem;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 1rem;
`;

const EmptyDescription = styled.p`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
`;

const AddResourceLink = styled(Link)`
  display: inline-block;
  padding: 0.8rem 1.5rem;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border-radius: 5px;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
    transform: translateY(-3px);
  }
`;

const ResourcesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const ResourceCard = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: ${({ theme }) => theme.shadows.small};
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: ${({ theme }) => theme.shadows.medium};
  }
`;

const ResourceType = styled.div`
  display: inline-flex;
  align-items: center;
  background-color: ${({ theme }) => `${theme.colors.primary}20`};
  color: ${({ theme }) => theme.colors.primary};
  padding: 0.3rem 0.8rem;
  border-radius: 5px;
  margin-bottom: 0.8rem;
  font-size: 0.9rem;
  font-weight: 500;
  align-self: flex-start;
  
  svg {
    margin-right: 0.5rem;
  }
`;

const ResourceTitle = styled(Link)`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 0.8rem;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const ResourceDescription = styled.p`
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 1rem;
  line-height: 1.5;
  flex-grow: 1;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const Tag = styled.span`
  background-color: ${({ theme }) => theme.colors.gray};
  color: ${({ theme }) => theme.colors.text};
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
`;

const TagCount = styled.span`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
`;

const ResourceFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ResourceMeta = styled.div`
  color: ${({ theme }) => theme.colors.textLight};
`;

const MetaItem = styled.span`
  font-size: 0.9rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: ${({ active, theme }) => active ? theme.colors.primary : theme.colors.textLight};
  cursor: pointer;
  position: relative;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => `${theme.colors.primary}10`};
  }
`;

const CopiedTooltip = styled.span`
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background-color: ${({ theme }) => theme.colors.text};
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  
  &:after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: ${({ theme }) => theme.colors.text} transparent transparent transparent;
  }
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 1.5rem;
  background-color: transparent;
  color: ${({ theme }) => theme.colors.primary};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${({ theme }) => `${theme.colors.primary}10`};
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

export default Resources;