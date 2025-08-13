// types/auth.types.ts

export interface User {
  id: string; // maps from "uid" in JWT
  
  // optional, in case backend still sends it
  role: 'HOD' | 'Principal';
  department?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null; // access token
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  userid: string; // changed from 'email' to 'userId'
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string; // access token
}
