import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HomePage/Login.css';
import { useAuthStore } from '../store/authStore';

const Login: React.FC = () => {
  const [userid, setUserid] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, isLoading, user } = useAuthStore();

  const handleLogin = async () => {
    setError('');

    if (!userid || !password) {
      setError('Please enter both User ID and password.');
      return;
    }

    try {
      await login({ userid, password });
      console.log('Login successful. User:', user);
      navigate('/Dash');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <input
        type="text"
        placeholder="Enter User ID"
        value={userid}
        onChange={e => setUserid(e.target.value)}
        disabled={isLoading}
      />
      <input
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        disabled={isLoading}
      />

      <button onClick={handleLogin} disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </div>
  );
};

export default Login;
