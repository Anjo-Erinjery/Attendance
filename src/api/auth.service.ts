import type { LoginCredentials, User } from '../types/auth.types';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://scanbyte-backend.onrender.com/api';

interface DecodedToken {
  token_type: string;
  exp: number;
  iat: number;
  jti: string;
  uid: string;
  role: string;
  department: string;
}

/**
 * Type guard to check if a string is a valid user role.
 * This function returns a boolean and refines the type for TypeScript.
 */
function isValidUserRole(role: string): role is "HOD" | "Principal" {
  return role === "HOD" || role === "Principal";
}

class AuthService {
  /**
   * Logs in with credentials and returns access + refresh tokens + decoded user.
   */
  async login(credentials: LoginCredentials): Promise<{ access: string; refresh: string; user: User }> {
    const response = await fetch(`${API_BASE_URL}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();

    localStorage.setItem('refreshToken', data.refresh);

    const decoded: DecodedToken = jwtDecode(data.access);

    if (!isValidUserRole(decoded.role)) {
      throw new Error(`Invalid user role received: ${decoded.role}`);
    }

    const user: User = {
      userid: decoded.uid,
      role: decoded.role, // TypeScript now understands this is safe due to the type guard
      department: decoded.department,
    };

    return {
      access: data.access,
      refresh: data.refresh,
      user,
    };
  }

  /**
   * Logs out by clearing stored tokens.
   */
  async logout(): Promise<void> {
    localStorage.removeItem('auth-storage');
    localStorage.removeItem('refreshToken');
  }

  /**
   * Uses refresh token to get a new access token.
   */
  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token found');

    const response = await fetch(`${API_BASE_URL}/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    return data.access;
  }

  /**
   * Fetches the current user details from token instead of API.
   */
  async getCurrentUser(): Promise<User> {
    const authState = localStorage.getItem('auth-storage');
    if (!authState) throw new Error('No token found');

    const parsed = JSON.parse(authState);
    const token = parsed.state?.token;
    if (!token) throw new Error('No token found in auth state');

    const decoded: DecodedToken = jwtDecode(token);

    if (!isValidUserRole(decoded.role)) {
      throw new Error(`Invalid user role received: ${decoded.role}`);
    }

    return {
      userid: decoded.uid,
      role: decoded.role,
      department: decoded.department,
    };
  }
}

export const authService = new AuthService();