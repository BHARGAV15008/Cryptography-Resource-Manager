import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize authentication state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          try {
            // Basic validation - check if token is a string and has a valid format
            // JWT tokens are typically in the format: xxx.yyy.zzz
            if (typeof token !== 'string' || !token.match(/^[\w-]*\.[\w-]*\.[\w-]*$/)) {
              console.warn('Invalid token format found in localStorage, removing it');
              localStorage.removeItem('token');
              setUser(null);
              setPermissions({});
              setLoading(false);
              return;
            }
            
            // Set up axios headers for future requests
            axios.defaults.headers.common['x-auth-token'] = token;
            
            // Fetch current user data
            fetchCurrentUser();
          } catch (error) {
            console.error('Error validating token:', error);
            localStorage.removeItem('token');
            setUser(null);
            setPermissions({});
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('token');
        setUser(null);
        setPermissions({});
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, []);
  
  // Fetch current user data using the token
  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data);
      
      // Set permissions based on user role
      setPermissions({
        canAccessDashboard: response.data.role !== 'regular',
        canManageUsers: response.data.role === 'admin',
        canManageContent: ['admin', 'authorized'].includes(response.data.role)
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching current user:', error);
      localStorage.removeItem('token');
      setUser(null);
      setPermissions({});
      setLoading(false);
    }
  };
  
  // Login user
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/auth/login', { email, password });
      
      const userData = response.data;
      
      // Set user data and token
      setUser(userData);
      localStorage.setItem('token', userData.token);
      
      // Set axios default header
      axios.defaults.headers.common['x-auth-token'] = userData.token;
      
      // Set permissions based on role
      setPermissions({
        canAccessDashboard: userData.role !== 'regular',
        canManageUsers: userData.role === 'admin',
        canManageContent: ['admin', 'authorized'].includes(userData.role)
      });
      
      setLoading(false);
      return { success: true, redirectTo: userData.redirectTo || '/' };
    } catch (err) {
      // Try mock login as fallback in development mode
      if (err.response && err.response.status === 500 && process.env.NODE_ENV === 'development') {
        console.warn('Regular login failed, attempting mock login for development');
        try {
          const mockResponse = await axios.post('/api/auth/mock-login', { email, password });
          
          const userData = mockResponse.data;
          
          // Set user data and token
          setUser(userData);
          localStorage.setItem('token', userData.token);
          
          // Set axios default header
          axios.defaults.headers.common['x-auth-token'] = userData.token;
          
          // Set permissions based on role
          setPermissions({
            canAccessDashboard: userData.role !== 'regular',
            canManageUsers: userData.role === 'admin',
            canManageContent: ['admin', 'authorized'].includes(userData.role)
          });
          
          setLoading(false);
          return { success: true, redirectTo: userData.redirectTo || '/' };
        } catch (mockError) {
          console.error('Mock login also failed:', mockError);
          // Continue to regular error handling
        }
      }
      
      let errorMessage = 'Login failed';
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = err.response.data.message || 'Invalid credentials';
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage = 'Server not responding. Please try again later.';
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };
  
  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['x-auth-token'];
    setUser(null);
    setPermissions({});
    return { success: true, redirectTo: '/login' };
  };
  
  // Register user
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/auth/register', userData);
      setLoading(false);
      return { success: true, message: response.data.message };
    } catch (err) {
      let errorMessage = 'Registration failed';
      
      if (err.response) {
        errorMessage = err.response.data.message || 'Registration failed';
      } else if (err.request) {
        errorMessage = 'Server not responding. Please try again later.';
      } else {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };
  
  // Check if user has a specific permission
  const hasPermission = (permission) => {
    return permissions[permission] || false;
  };
  
  const value = {
    user,
    permissions,
    loading,
    error,
    login,
    logout,
    register,
    hasPermission
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;