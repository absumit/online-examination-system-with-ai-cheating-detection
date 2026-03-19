import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ExamPage from './pages/ExamPage';
import ResultsPage from './pages/ResultsPage';
import NotFound from './pages/NotFound';

// Components
import Navbar from './components/Navbar';

const ProtectedRoute = ({ element, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-xl">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" />;
  }

  return element;
};

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route
          path="/admin/dashboard"
          element={<ProtectedRoute element={<AdminDashboard />} allowedRoles={['admin']} />}
        />
        
        <Route
          path="/student/dashboard"
          element={<ProtectedRoute element={<StudentDashboard />} allowedRoles={['student']} />}
        />
        
        <Route
          path="/student/exam/:examId"
          element={<ProtectedRoute element={<ExamPage />} allowedRoles={['student']} />}
        />
        
        <Route
          path="/student/result/:attemptId"
          element={<ProtectedRoute element={<ResultsPage />} allowedRoles={['student']} />}
        />
        
        <Route path="/" element={user ? (
          user.role === 'admin' ? <Navigate to="/admin/dashboard" /> : <Navigate to="/student/dashboard" />
        ) : (
          <Navigate to="/login" />
        )} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
