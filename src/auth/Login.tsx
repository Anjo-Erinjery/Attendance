import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import { useAuthStore } from '../store/authStore'; // Import the auth store

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const authStore = useAuthStore(); // Get the auth store instance

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    try {
      // Call the login function from the auth store
      // This will make the API call and update the store's state (user, token, isAuthenticated)
      await authStore.login({ email, password });

      console.log('Login successful via authStore. Navigating to /Dash');
      console.log('Current user:', authStore.user);
      // Navigate to the dashboard after successful login and state update
      navigate('/Dash'); // Corrected path to match App.tsx route

    } catch (error: any) {
      console.error('Login error:', error);
      // Display the error message from the authStore's login function or a generic one
      setError(error.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input
        type="email"
        placeholder="Enter email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default Login;
