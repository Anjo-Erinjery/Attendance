import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, User, LoginCredentials } from '../types/auth.types';
import {jwtDecode} from 'jwt-decode'; // ✅ correct import


const API_BASE_URL = 'http://localhost:8000/api/'; // ✅ use ngrok or production URL

interface DecodedToken {
  uid: string;
  role: string;
  department: string;
  exp: number;
  iat: number;
  token_type: string;
}
// Define the API base URL. This should match your backend server's address.
// It's good practice to use an environment variable for this in a real application.
const API_BASE_URL = 'http://localhost:3004/api'; 


interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${API_BASE_URL}token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown login error' }));
            throw new Error(errorData.message || 'Login failed');
          }

          const data = await response.json();

          // ✅ store refresh token
          localStorage.setItem('refreshToken', data.refresh);

          // ✅ decode access token
          const decoded: DecodedToken = jwtDecode(data.access);

          set({
            user: {
              id: decoded.uid, // match auth.types.ts
              role: decoded.role as User['role'],
              department: decoded.department,
            },
            token: data.access,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('refreshToken'); // ✅ clear refresh token
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      },

      setUser: (user: User) => set({ user }),
      setToken: (token: string) => set({ token }),
      clearAuth: () => {
        localStorage.removeItem('refreshToken');
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
