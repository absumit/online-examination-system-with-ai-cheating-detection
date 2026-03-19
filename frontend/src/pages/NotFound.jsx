import React from 'react';
import { useNavigate } from 'react-router-dom';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-9xl font-bold text-white mb-4">404</div>
        <h1 className="text-4xl font-bold text-white mb-4">Page Not Found</h1>
        <p className="text-xl text-gray-400 mb-8">The page you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}

export default NotFound;
