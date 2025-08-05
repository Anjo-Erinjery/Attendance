import React, { useState } from 'react';
import 'C:/Users/anjos/Desktop/React-Vite/FReact/src/styles/Login.css';

const PrincipalLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // authentication logic goes here
    console.log('Principal logged in with:', username, password);
  };

  return (
    <div className="login-container">
      <h2>Principal Login</h2>
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