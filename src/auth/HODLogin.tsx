import React, { useState } from 'react';
<<<<<<< HEAD
import '../styles/Login.css'; // ✅ This is relative and correct

=======
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
>>>>>>> origin/principal

const HODLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'HOD', email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        navigate('/Dash');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      setError('Network error');
    }
  };

  return (
    <div className="login-container">
      <h2>HOD Login</h2>
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

export default HODLogin;
