import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { loginUser, googleLogin } from '../utils/api';
import { AuthContext } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const response = await loginUser(email, password);
      login(response.data.user);
      
      if (response.data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data || 'Login failed. Please try again.';
      setError(errorMsg);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const response = await googleLogin(credentialResponse.credential);
      login(response.data.user);
      
      if (response.data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Google login failed';
      setError(errorMsg);
      console.error('Google login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-6 md:py-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8 md:mb-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-sm sm:text-base text-gray-500">Sign in to your exam account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-6 text-xs sm:text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 mb-6 md:mb-8">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900 placeholder-gray-500 transition text-sm sm:text-base"
                placeholder="Email address"
                required
              />
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900 placeholder-gray-500 transition text-sm sm:text-base"
                placeholder="Password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-medium py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center mb-6 md:mb-8">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-3 sm:px-4 text-gray-500 text-xs sm:text-sm">or continue with</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Google Login */}
          <div className="flex justify-center mb-6 md:mb-8 overflow-x-auto">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google login failed')}
              theme="outline"
              size="large"
              text="signin"
            />
          </div>

          {/* Footer */}
          <p className="text-center text-gray-600 text-xs sm:text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium transition">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

export default Login;
