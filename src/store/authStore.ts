import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// Import only the necessary types from auth.types.ts
import type { AuthState, User, LoginCredentials } from '../types/auth.types';

// Import jwtDecode once and correctly
import { jwtDecode } from 'jwt-decode';


// Define the API base URL. Using import.meta.env for better environment management.
// For development, it defaults to localhost:8000/api/.
// This is the ONLY declaration for API_BASE_URL.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/';


// Define the structure of the decoded JWT token payload.
// This interface outlines the claims (information) expected within your JWT.
interface DecodedToken {
  uid: string; // User ID
  role: string; // User's role as a string (e.g., "HOD", "Principal")
  department: string; // User's department
  exp: number; // Expiration timestamp (seconds since epoch)
  iat: number; // Issued at timestamp (seconds since epoch)
  token_type: string; // Type of token (e.g., "bearer")
}

// Extend your AuthState from auth.types.ts with additional Zustand store-specific actions
// and include refreshToken in the state for easier access by refreshAccessToken.
// This interface combines the base authentication state with actions that can modify it.
interface AuthStore extends AuthState {
  refreshToken: string | null; // Stores the refresh token in the Zustand state for convenience
  login: (credentials: LoginCredentials) => Promise<void>; // Function to handle user login
  logout: () => void; // Function to handle user logout
  setUser: (user: User) => void; // Function to set only the user data
  setToken: (token: string) => void; // Function to set only the access token
  // New function to set both access and refresh tokens, useful after token refresh
  setAuthTokens: (accessToken: string, refreshToken: string | null) => void;
  clearAuth: () => void; // Function to clear all authentication data
  isLoading: boolean; // State to indicate if an authentication operation is in progress
}


// Create the Zustand store for authentication.

// Define the base API URL for your Django backend
// It's recommended to use environment variables (e.g., import.meta.env.VITE_API_URL for Vite)
// For now, it's hardcoded to localhost, but adjust this for production or using ngrok.


// Create the Zustand store for authentication

export const useAuthStore = create<AuthStore>()(
  // The 'persist' middleware automatically saves and loads the store's state
  // from local storage, ensuring authentication state persists across browser sessions.
  persist(
    (set, get) => ({
      user: null, // Initial state: no user logged in
      token: null, // Initial state: no access token
      refreshToken: null, // Initial state: no refresh token
      isAuthenticated: false, // Initial state: not authenticated
      isLoading: false, // Initial state: not loading

      /**
       * Handles user login by authenticating with the backend API.
       * On success, updates the store with user details and tokens.
       * @param credentials - User's login email and password.
       */
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true }); // Indicate that login is in progress
        try {
          const response = await fetch(`${API_BASE_URL}token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
          });

          // Check if the HTTP response indicates success (status code 2xx).
          if (!response.ok) {
            // Attempt to parse error details from the response, defaulting to a generic message.
            const errorData = await response.json().catch(() => ({ message: 'Unknown login error' }));
            // Throw an error with a specific message, useful for displaying to the user.
            throw new Error(errorData.detail || errorData.message || 'Login failed');
          }

          // Parse the successful response data (which contains access and refresh tokens).
          const data = await response.json();

          // Store the refresh token directly in localStorage for long-term persistence.
          localStorage.setItem('refreshToken', data.refresh);

          // Decode the access token to extract user-specific information.
          const decoded: DecodedToken = jwtDecode(data.access);

          // Update the Zustand store's state with the authenticated user's data and tokens.
          set({
            user: {
              id: decoded.uid, // Assign 'uid' from token to 'id' in User object
              role: decoded.role as User['role'], // Type cast to ensure compatibility with UserRole
              department: decoded.department,
            },
            token: data.access,
            refreshToken: data.refresh, // Store refresh token in Zustand state as well
            isAuthenticated: true,
            isLoading: false, // Login attempt completed
          });
          console.log("Login successful. User ID:", decoded.uid, "Role:", decoded.role);
        } catch (error: any) {
          set({ isLoading: false }); // Login failed, reset loading state
          console.error("Login error:", error.message);
          throw error; // Re-throw the error for consuming components to handle
        }
      },

      /**
       * Logs out the user by clearing all authentication-related data from the store and localStorage.
       */
      logout: () => {
        localStorage.removeItem('refreshToken'); // Clear refresh token from localStorage
        // Reset all authentication-related states to their initial values.
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false });
        console.log("User logged out.");
      },

      /**
       * Updates only the user data in the store.
       * @param user - The user object to set.
       */
      setUser: (user: User) => set({ user }),

      /**
       * Updates only the access token in the store.
       * @param token - The access token string to set.
       */
      setToken: (token: string) => set({ token }),

      /**
       * Sets both access and refresh tokens in the store, typically used after a token refresh.
       * It also decodes the new access token to update user details.
       * @param accessToken - The new access token.
       * @param newRefreshToken - The new refresh token (can be null if not provided by backend).
       */
      setAuthTokens: (accessToken: string, newRefreshToken: string | null) => {
        try {
          const decoded: DecodedToken = jwtDecode(accessToken);
          set({
            token: accessToken,
            refreshToken: newRefreshToken, // Update refresh token in state
            user: {
              id: decoded.uid,
              role: decoded.role as User['role'],
              department: decoded.department,
            },
            isAuthenticated: true,
          });
          // Also update localStorage with the new refresh token if available.
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }
          console.log("Auth tokens updated successfully.");
        } catch (error) {
          console.error("Error decoding token during setAuthTokens:", error);
          // If decoding fails, it indicates an invalid token, so clear auth state.
          get().clearAuth();
        }
      },

      /**
       * Clears all authentication-related data from the store and localStorage.
       */
      clearAuth: () => {
        localStorage.removeItem('refreshToken');
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false });
        console.log("Authentication data cleared.");
      },
    }),
    {
      name: 'auth-storage', // The name of the item in localStorage where the state will be stored.
      // `partialize` determines which parts of the store's state should be persisted.
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        // refreshToken is managed manually via localStorage.setItem and is intentionally
        // excluded from `partialize` to avoid duplication by the persist middleware itself.
      }),
    }
  )
);

/**
 * Attempts to refresh the access token using the stored refresh token.
 * This function is exported separately to be used by the `wrappedFetch` utility.
 * @returns {Promise<boolean>} True if refresh was successful, false otherwise.
 */
export const refreshAccessToken = async (): Promise<boolean> => {
  // Get the current state and actions directly from the store.
  const { refreshToken, setAuthTokens, logout } = useAuthStore.getState();

  if (!refreshToken) {
    console.warn("No refresh token available. User needs to log in again.");
    logout(); // Force logout if no refresh token is found, as the session cannot be refreshed.
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
      logout(); // Log out if refresh fails (e.g., refresh token is invalid or expired).
      return false;
    }

    const data = await response.json();
    // Update both access token in state and potentially the refresh token if the backend provides a new one.
    setAuthTokens(data.access, data.refresh || refreshToken);
    console.log("Access token refreshed successfully.");
    return true;
  } catch (error) {
    console.error("Network or other error during token refresh:", error);
    logout(); // Log out on network errors or other unexpected refresh failures.
    return false;
  }
};

/**
 * A wrapper around the native `fetch` API that automatically handles:
 * 1. Adding the Authorization header with the current access token.
 * 2. Intercepting 401 Unauthorized responses to attempt token refresh.
 * 3. Retrying the original request with the new access token if refresh is successful.
 * @param {RequestInfo} input - The URL or Request object for the fetch request.
 * @param {RequestInit} [init] - Optional settings for the fetch request.
 * @returns {Promise<Response>} - The response from the fetch request.
 */
export const wrappedFetch = async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
  const { token, isAuthenticated, logout } = useAuthStore.getState();

  // Create a mutable Headers object to add/modify headers.
  let headers = new Headers(init?.headers);
  // If authenticated and a token exists, add the Authorization header.
  if (isAuthenticated && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Make the initial fetch request.
  let response = await fetch(input, { ...init, headers });

  // Check if the response is 401 Unauthorized AND the user is authenticated AND
  // the request is not already for the token refresh or initial token endpoints
  // (to prevent infinite loops).
  if (
    response.status === 401 &&
    isAuthenticated &&
    token &&
    !input.toString().includes('token/refresh/') &&
    !input.toString().includes('token/')
  ) {
    console.warn("Received 401 Unauthorized. Attempting to refresh token...");
    // Attempt to refresh the access token.
    const refreshSuccessful = await refreshAccessToken();

    if (refreshSuccessful) {
      // If refresh was successful, get the new access token from the store.
      const newToken = useAuthStore.getState().token;
      if (newToken) {
        // Update the Authorization header with the new token.
        headers.set('Authorization', `Bearer ${newToken}`);
        console.log("Retrying original request with new token.");
        // Retry the original fetch request with the updated token.
        response = await fetch(input, { ...init, headers });
      } else {
        // This case indicates an inconsistency (refresh succeeded but no token).
        console.error("Token refresh succeeded but no new token found in store. Forcing logout.");
        logout();
        throw new Error("Unauthorized: Could not obtain new token after refresh.");
      }
    } else {
      // If token refresh failed, the user has already been logged out by `refreshAccessToken`.
      throw new Error("Unauthorized: Could not refresh token. Please log in again.");
    }
  }

  return response; // Return the (original or retried) response.
};
