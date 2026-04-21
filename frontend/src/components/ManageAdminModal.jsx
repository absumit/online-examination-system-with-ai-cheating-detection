import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function ManageAdminModal({ onClose }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/get-admins');
      setAdmins(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError('Name, email, and password are required');
      setFormLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setFormLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      setFormLoading(false);
      return;
    }

    try {
      await api.post('/admin/create-admin', formData);
      setFormData({ name: '', email: '', password: '', age: '' });
      setShowAddForm(false);
      setError('');
      await fetchAdmins();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data || 'Failed to create admin';
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (window.confirm('Are you sure you want to delete this admin? This action cannot be undone.')) {
      try {
        await api.delete(`/admin/delete-admin/${adminId}`);
        await fetchAdmins();
        setError('');
      } catch (err) {
        const errorMsg = err.response?.data?.message || 'Failed to delete admin';
        setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center px-4 py-4 z-50 min-h-screen overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 pb-4 sm:pb-6 border-b-2 border-gray-200 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Manage Admin Users</h2>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">Add or remove admin users from the system</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl sm:text-3xl font-light"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-3 sm:px-5 py-2 sm:py-4 rounded-lg mb-4 sm:mb-6 shadow-sm text-xs sm:text-base">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-base sm:text-lg">Loading admins...</p>
          </div>
        ) : (
          <>
            {/* Add Admin Section */}
            <div className="mb-6 sm:mb-8 pb-6 sm:pb-8 border-b-2 border-gray-200">
              {!showAddForm ? (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 sm:py-3 rounded-lg transition shadow-sm hover:shadow-md text-sm sm:text-base"
                >
                  + Add New Admin
                </button>
              ) : (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 sm:p-6 rounded-xl border-2 border-green-300">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-5">Create New Admin</h3>
                  <form onSubmit={handleAddAdmin} className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm text-gray-700 font-semibold mb-1 sm:mb-2">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-2 sm:px-4 py-1.5 sm:py-2 border-2 border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
                        placeholder="Enter admin name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm text-gray-700 font-semibold mb-1 sm:mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-2 sm:px-4 py-1.5 sm:py-2 border-2 border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
                        placeholder="Enter admin email"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm text-gray-700 font-semibold mb-1 sm:mb-2">Password</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-2 sm:px-4 py-1.5 sm:py-2 border-2 border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
                        placeholder="Enter password (min 6 characters)"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm text-gray-700 font-semibold mb-1 sm:mb-2">Age (Optional)</label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        className="w-full px-2 sm:px-4 py-1.5 sm:py-2 border-2 border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
                        placeholder="Enter age"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t-2 border-green-200">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false);
                          setFormData({ name: '', email: '', password: '', age: '' });
                        }}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-1.5 sm:py-2 rounded-lg transition text-xs sm:text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={formLoading}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 sm:py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                      >
                        {formLoading ? 'Adding...' : 'Add Admin'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Admins List Section */}
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-5">Existing Admins</h3>
              {admins.length === 0 ? (
                <p className="text-gray-600 text-center py-6 sm:py-8 bg-gray-50 rounded-lg text-sm sm:text-base">No admin users found</p>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {admins.map(admin => (
                    <div
                      key={admin._id}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-3 sm:p-5 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-md transition gap-3"
                    >
                      <div className="flex-1 w-full">
                        <p className="font-bold text-gray-900 text-base sm:text-lg">{admin.name}</p>
                        <p className="text-xs sm:text-sm text-gray-600">{admin.email}</p>
                        {admin.age && (
                          <p className="text-xs text-gray-500 mt-1">Age: {admin.age}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteAdmin(admin._id)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg transition shadow-sm hover:shadow-md text-xs sm:text-base w-full sm:w-auto"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ManageAdminModal;
