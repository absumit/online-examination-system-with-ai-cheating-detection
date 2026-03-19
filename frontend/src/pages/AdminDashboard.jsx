import React, { useState, useEffect } from 'react';
import { getAdminExams, deleteExam, publishExam, getAdminExamAttempts } from '../utils/api';
import CreateExamModal from '../components/CreateExamModal';

function AdminDashboard() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await getAdminExams();
      setExams(response.data);
    } catch (err) {
      setError(err.response?.data || 'Failed to fetch exams');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (examId) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      try {
        await deleteExam(examId);
        setExams(exams.filter(exam => exam._id !== examId));
      } catch (err) {
        setError('Failed to delete exam');
      }
    }
  };

  const handlePublishExam = async (examId) => {
    try {
      const exam = exams.find(e => e._id === examId);
      await publishExam(examId, { isPublished: !exam.isPublished, status: 'Active' });
      fetchExams();
    } catch (err) {
      setError('Failed to publish exam');
    }
  };

  const handleViewAttempts = async (exam) => {
    try {
      setSelectedExam(exam);
      setAttemptsLoading(true);
      const response = await getAdminExamAttempts(exam._id);
      setAttempts(response.data);
      setShowAnalysis(true);
    } catch (err) {
      setError('Failed to fetch student attempts');
    } finally {
      setAttemptsLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-xl">Loading exams...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Admin Dashboard</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition"
          >
            + Create Exam
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {showModal && (
          <CreateExamModal
            onClose={() => setShowModal(false)}
            onExamCreated={() => {
              setShowModal(false);
              fetchExams();
            }}
          />
        )}

        {exams.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No exams created yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {exams.map(exam => (
              <div key={exam._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800">{exam.title}</h3>
                    <p className="text-gray-600">{exam.subject}</p>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <p className="text-sm text-gray-700"><strong>Duration:</strong> {exam.duration} min</p>
                      <p className="text-sm text-gray-700"><strong>Total Questions:</strong> {exam.totalQuestions}</p>
                      <p className="text-sm text-gray-700"><strong>Total Marks:</strong> {exam.totalMarks}</p>
                      <p className="text-sm text-gray-700"><strong>Passing Score:</strong> {exam.passingScore}</p>
                    </div>
                  </div>
                  <div className="space-y-2 ml-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      exam.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {exam.isPublished ? 'Published' : 'Draft'}
                    </span>
                    <span className="block text-xs text-gray-500">{exam.status}</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleViewAttempts(exam)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition"
                  >
                    View Attempts
                  </button>
                  <button
                    onClick={() => handlePublishExam(exam._id)}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      exam.isPublished
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {exam.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => handleDeleteExam(exam._id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">{selectedExam?.title} - Student Attempts</h2>
              <button
                onClick={() => setShowAnalysis(false)}
                className="text-gray-600 hover:text-gray-800 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {attemptsLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading attempts...</p>
                </div>
              ) : attempts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No student attempts yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Student Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Score</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Attempted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attempts.map((attempt, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-800">{attempt.studentId?.name || 'Unknown'}</td>
                          <td className="px-4 py-3 text-gray-600">{attempt.studentId?.email || 'N/A'}</td>
                          <td className="px-4 py-3 text-gray-800 font-semibold">{attempt.totalMarksObtained || 0}/{selectedExam?.totalMarks || 0}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              attempt.status === 'InProgress'
                                ? 'bg-yellow-100 text-yellow-800'
                                : attempt.isPassed
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {attempt.status === 'InProgress' ? 'In Progress' : attempt.isPassed ? 'Passed' : 'Failed'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-sm">
                            {attempt.startTime ? new Date(attempt.startTime).toLocaleString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
