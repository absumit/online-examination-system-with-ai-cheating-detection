import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../utils/api';
import { AuthContext } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

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
      <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="font-bold text-lg sm:text-xl md:text-2xl">Exam System</div>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-blue-800 transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Desktop Menu */}
        {user && (
          <div className="hidden md:flex items-center space-x-3 lg:space-x-6">
            <span className="text-xs sm:text-sm">
              Welcome, <span className="font-semibold">{user.name}</span>
            </span>
            <span className="bg-white text-blue-600 px-2 sm:px-3 py-1 rounded-full text-xs font-semibold">
              {user.role.toUpperCase()}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition text-sm sm:text-base"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {isOpen && user && (
        <div className="md:hidden bg-blue-700 border-t border-blue-600 px-4 py-4 space-y-3">
          <div className="text-sm">
            Welcome, <span className="font-semibold">{user.name}</span>
          </div>
          <div className="bg-white text-blue-600 px-3 py-1 rounded-full text-xs font-semibold inline-block">
            {user.role.toUpperCase()}
          </div>
          <button
            onClick={() => {
              handleLogout();
              setIsOpen(false);
            }}
            className="w-full bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold transition text-sm"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;

