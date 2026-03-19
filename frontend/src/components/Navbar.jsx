import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../utils/api';
import { AuthContext } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      // ignore (still clear local state)
    } finally {
      logout();
      navigate('/login');
    }
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="font-bold text-2xl">Exam System</div>
        </div>

        {user && (
          <div className="flex items-center space-x-6">
            <span className="text-sm">
              Welcome, <span className="font-semibold">{user.name}</span>
            </span>
            <span className="bg-white text-blue-600 px-3 py-1 rounded-full text-xs font-semibold">
              {user.role.toUpperCase()}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

