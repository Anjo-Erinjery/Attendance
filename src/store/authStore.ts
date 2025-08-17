import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, User, LoginCredentials } from '../types/auth.types';

import { jwtDecode } from 'jwt-decode';

// ✅ correct import


const API_BASE_URL = 'http://localhost:8000/api/'; // ✅ use ngrok or production URL


// Define the structure of the decoded JWT token payload
interface DecodedToken {
  uid: string;
  role: string;
  department: string;
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
  token_type: string;
}
// Define the API base URL. This should match your backend server's address.
// It's good practice to use an environment variable for this in a real application.



// Extend your AuthState from auth.types.ts with additional Zustand store specific actions
// and include refreshToken in the state for easier access by refreshAccessToken
interface AuthStore extends AuthState {
  refreshToken: string | null; // Store refresh token in Zustand state for easier access
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setAuthTokens: (accessToken: string, refreshToken: string | null) => void; // New function to set both tokens
  clearAuth: () => void;
  isLoading: boolean; // Add isLoading state
}

// Define the base API URL for your Django backend
// It's recommended to use environment variables (e.g., import.meta.env.VITE_API_URL for Vite)
// For now, it's hardcoded to localhost, but adjust this for production or using ngrok.


// Create the Zustand store for authentication
export const useAuthStore = create<AuthStore>()(
  // Use the persist middleware to automatically save and load the store's state from local storage
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null, // Initialize refreshToken state
      isAuthenticated: false,
      isLoading: false, // Initial state for loading

      // Function to handle user login
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true }); // Set loading to true during login attempt
        try {
          const response = await fetch(`${API_BASE_URL}token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown login error' }));
            throw new Error(errorData.detail || errorData.message || 'Login failed'); // Handle Django Rest Framework errors
          }

          const data = await response.json();

          // Store refresh token in localStorage for persistence across browser sessions
          localStorage.setItem('refreshToken', data.refresh);

          // Decode the access token to get user details
          const decoded: DecodedToken = jwtDecode(data.access);

          set({
            user: {
              id: decoded.uid,
              role: decoded.role as User['role'], // Cast to User['role'] to match the type definition
              department: decoded.department,
            },
            token: data.access,
            refreshToken: data.refresh, // Store refresh token in Zustand state
            isAuthenticated: true,
            isLoading: false, // Login complete, set loading to false
          });
          console.log("Login successful. User:", decoded.uid, "Role:", decoded.role);
        } catch (error: any) {
          set({ isLoading: false }); // Login failed, set loading to false
          console.error("Login error:", error.message);
          throw error; // Re-throw the error for component to handle
        }
      },

      // Function to handle user logout
      logout: () => {
        localStorage.removeItem('refreshToken'); // Clear refresh token from localStorage
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false });
        console.log("User logged out.");
      },

      // Set only user data
      setUser: (user: User) => set({ user }),

      // Set only access token
      setToken: (token: string) => set({ token }),

      // Set both access and refresh tokens after a refresh or initial login
      setAuthTokens: (accessToken: string, newRefreshToken: string | null) => {
        try {
          const decoded: DecodedToken = jwtDecode(accessToken);
          set({
            token: accessToken,
            refreshToken: newRefreshToken, // Update refreshToken in state
            user: {
              id: decoded.uid,
              role: decoded.role as User['role'],
              department: decoded.department,
            },
            isAuthenticated: true,
          });
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken); // Also update localStorage
          }
          console.log("Auth tokens updated.");
        } catch (error) {
          console.error("Error decoding token during setAuthTokens:", error);
          get().clearAuth(); // Clear auth if token is invalid
        }
      },

      // Clear all authentication-related data
      clearAuth: () => {
        localStorage.removeItem('refreshToken');
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false });
        console.log("Authentication data cleared.");
      },
    }),
    {
      name: 'auth-storage', // Name for the item in local storage
      // Only store user, token, and isAuthenticated in localStorage by default.
      // refreshToken is handled separately by localStorage.setItem for direct access.
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        // Do NOT include refreshToken here if you are handling it manually via localStorage.setItem/getItem
        // Otherwise, it will be duplicated in state and localStorage by the persist middleware itself.
      }),
    }
  )
);

/**
 * Attempts to refresh the access token using the stored refresh token.
 * @returns {Promise<boolean>} True if refresh was successful, false otherwise.
 */
export const refreshAccessToken = async (): Promise<boolean> => {
  // Get the current state directly from the store
  const { refreshToken, setAuthTokens, logout } = useAuthStore.getState();

  if (!refreshToken) {
    console.warn("No refresh token available. User needs to log in again.");
    logout(); // Force logout if no refresh token is present
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown refresh error' }));
      console.error("Failed to refresh token:", errorData);
      logout(); // Log out if refresh fails (e.g., refresh token is invalid or expired)
      return false;
    }

    const data = await response.json();
    // Update both access token in state, and potentially refresh token if the backend returns a new one
    // Assuming the backend sends a new access token and potentially the same refresh token, or a new one.
    setAuthTokens(data.access, data.refresh || refreshToken);
    console.log("Access token refreshed successfully.");
    return true;
  } catch (error) {
    console.error("Network or other error during token refresh:", error);
    logout(); // Log out on network errors or other refresh failures
    return false;
  }
};

/**
 * A wrapper around the native `fetch` API that automatically handles:
 * 1. Adding the Authorization header with the current access token.
 * 2. Intercepting 401 Unauthorized responses to attempt token refresh.
 * 3. Retrying the original request with the new access token if refresh is successful.
 * @param {RequestInfo} input The URL or Request object.
 * @param {RequestInit} [init] Options for the fetch request.
 * @returns {Promise<Response>} The response from the fetch request.
 */
export const wrappedFetch = async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
  const { token, isAuthenticated, logout } = useAuthStore.getState();

  let headers = new Headers(init?.headers); // Create a mutable Headers object
  if (isAuthenticated && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(input, { ...init, headers });

  // Check if it's a 401 Unauthorized error and NOT the token refresh endpoint itself
  if (
    response.status === 401 &&
    isAuthenticated &&
    token &&
    !input.toString().includes('token/refresh/') && // Avoid infinite loop on refresh endpoint
    !input.toString().includes('token/') // Also exclude initial token endpoint
  ) {
    console.warn("Received 401 Unauthorized. Attempting to refresh token...");
    const refreshSuccessful = await refreshAccessToken();

    if (refreshSuccessful) {
      // Retry the original request with the new token
      const newToken = useAuthStore.getState().token;
      if (newToken) {
        headers.set('Authorization', `Bearer ${newToken}`);
        console.log("Retrying original request with new token.");
        // Clone the response if you need to read it multiple times, but here we just retry the fetch.
        response = await fetch(input, { ...init, headers });
      } else {
        // This case should ideally not happen if refreshAccessToken was successful
        console.error("Token refresh succeeded but no new token found in store. Forcing logout.");
        logout();
        throw new Error("Unauthorized: Could not obtain new token after refresh.");
      }
    } else {
      // If refresh failed, refreshAccessToken would have already logged out the user.
      throw new Error("Unauthorized: Could not refresh token. Please log in again.");
    }
  }

  return response;
};
