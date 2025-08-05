import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'C:/Users/anjos/Desktop/React-Vite/FReact/src/styles/Login.css';

const PrincipalLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('');
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'Principal', username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log('Login successful:', data);
        console.log('Redirecting to dashboard...');
        navigate('/Dash');
      } else {
        setError(data.message || 'Login failed');
        console.error('Login failed:', data.message || 'Unknown error');
        console.error('Response status:', response.status);
      }
    } catch (error) {
      setError('Network error');
      console.error('Network error:', error);
    }
  };

  return (
    <div className="login-container">
      <h2>Principal Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input
        type="text"
        placeholder="Enter username"
        value={username}
        onChange={e => setUsername(e.target.value)}
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

export default PrincipalLogin;
