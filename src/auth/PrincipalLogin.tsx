import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css'; // Assuming all styling is handled here

const PrincipalLogin: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null); // State for displaying UI error messages
    const navigate = useNavigate();

    const handleLogin = () => {
        // Clear any previous error messages
        setErrorMessage(null);

        // --- Hardcoded Authentication Logic (No API Call) ---
        // For demonstration purposes, this directly checks credentials.
        // In a real application, you would integrate with a backend API here.
        if (username === 'principal' && password === 'password') {
            console.log('Principal logged in successfully (client-side simulation)!');
            // Redirect to the Principal Dashboard page
            navigate('/principal-dashboard');
        } else {
            // Display error message directly on the UI
            setErrorMessage('Invalid username or password. Please try again.');
        }
    };

    return (
        <div className="login-container min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
            <div className="login-box bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200">
                <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-8">Principal Login</h2>

                {/* Error Message Display */}
                {errorMessage && (
                    <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                        <span className="block sm:inline">{errorMessage}</span>
                    </div>
                )}

                <div className="mb-5">
                    <input
                        type="text"
                        placeholder="Enter username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out text-gray-700 placeholder-gray-400"
                    />
                </div>
                <div className="mb-6">
                    <input
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out text-gray-700 placeholder-gray-400"
                    />
                </div>
                <button
                    onClick={handleLogin}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
                >
                    Login
                </button>
            </div>
        </div>
    );
};

export default PrincipalLogin;
