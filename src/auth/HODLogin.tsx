import React, { useState } from 'react';
import 'C:/Users/anjos/Desktop/React-Vite/FReact/src/styles/Login.css';

const HODLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // authentication logic goes here
    console.log('HOD logged in with:', email, password);
  };

  return (
    <div className="login-container">
      <h2>HOD Login</h2>
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