// Get API URL from Environment Variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import { createContext, useState, useEffect, useContext } from 'react';

// Create authentication context for global state management
export const AuthContext = createContext();

/**
 * AuthProvider — Wraps the app and provides authentication state
 * Handles JWT token persistence via localStorage
 * Automatically validates token on page load
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Validate existing token on initial load
  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('Token invalid'); // If a 401/500 error occurs
            return res.json();
          })
        .then(data => {
          setUser(data.user || data); // Set user data
          setLoading(false);
          })
        .catch(() => {
          // Clear invalid token from storage
          setToken(null);
          localStorage.removeItem('token');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  /**
   * login — Stores JWT token and user data after successful authentication
   * @param {string} token - JWT token from server
   * @param {object} userData - Authenticated user object
   */
  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setToken(token);
    setUser(userData);
  };

  /**
   * logout — Clears authentication state and removes token from storage
   */
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth — Custom hook to access authentication context
 * Usage: const { user, login, logout } = useAuth();
 */
export const useAuth = () => {
  return useContext(AuthContext);
};

  