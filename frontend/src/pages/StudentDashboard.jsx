import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublishedExams, getExamHistory } from '../utils/api';

function StudentDashboard() {
  const [exams, setExams] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('available');
  const navigate = useNavigate();

  // Get exam status based on schedule
  const getExamStatus = (exam) => {
    if (!exam.scheduleStartTime || !exam.scheduleEndTime) {
      return { status: 'active', label: 'Active', color: 'green' };
    }

    const now = new Date();
    const startTime = new Date(exam.scheduleStartTime);
    const endTime = new Date(exam.scheduleEndTime);

    if (now < startTime) {
      return { 
        status: 'scheduled', 
        label: `Available on ${startTime.toLocaleString()}`, 
        color: 'blue' 
      };
    } else if (now > endTime) {
      return { 
        status: 'expired', 
        label: 'Expired', 
        color: 'red' 
      };
    } else {
      return { 
        status: 'active', 
        label: `Closes on ${endTime.toLocaleString()}`, 
        color: 'green' 
      };
    }
  };

  useEffect(() => {
    fetchExams();
    fetchHistory();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await getPublishedExams();
      setExams(response.data);
    } catch (err) {
      setError(err.response?.data || 'Failed to fetch exams');
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await getExamHistory();
      setHistory(response.data);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = (examId) => {
    navigate(`/student/exam/${examId}`);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-xl">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Student Dashboard</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'available'
                ? 'border-b-4 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Available Exams ({exams.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'history'
                ? 'border-b-4 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Exam History ({history.length})
          </button>
        </div>

        {/* Available Exams Tab */}
        {activeTab === 'available' && (
          <div>
            {exams.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No exams available at the moment</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {exams.map(exam => {
                  const examStatus = getExamStatus(exam);
                  return (
                  <div key={exam._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-800">{exam.title}</h3>
                        <p className="text-gray-600 mb-4">{exam.subject}</p>
                        {exam.description && (
                          <p className="text-gray-700 mb-4">{exam.description}</p>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Duration</p>
                            <p className="text-lg font-semibold text-gray-800">{exam.duration} min</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Questions</p>
                            <p className="text-lg font-semibold text-gray-800">{exam.totalQuestions}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total Marks</p>
                            <p className="text-lg font-semibold text-gray-800">{exam.totalMarks}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Pass Score</p>
                            <p className="text-lg font-semibold text-gray-800">{exam.passingScore}</p>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          exam.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                          exam.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {exam.difficulty}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-6">
                      <div className="flex gap-3">
                        <span className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold ${
                          examStatus.color === 'green' ? 'bg-green-100 text-green-800' :
                          examStatus.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {examStatus.label}
                        </span>
                        <span className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold ${
                          exam.hasAppeared ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {exam.hasAppeared ? '✓ Appeared' : '⊘ Not Appeared'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleStartExam(exam._id)}
                        disabled={examStatus.status !== 'active'}
                        className={`font-bold py-2 px-6 rounded-lg transition ${
                          examStatus.status === 'active'
                            ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {examStatus.status === 'active' ? 'Start Exam →' : 'Unavailable'}
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div>
            {history.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No exam attempts yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full bg-white rounded-lg shadow">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="px-6 py-3 text-left font-semibold text-gray-800">Exam Title</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-800">Subject</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-800">Marks</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-800">Percentage</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-800">Status</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-800">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(attempt => (
                      <tr key={attempt.attemptId} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-3 font-semibold text-gray-800">{attempt.examTitle}</td>
                        <td className="px-6 py-3 text-gray-700">{attempt.subject}</td>
                        <td className="px-6 py-3 text-gray-700">{attempt.marksObtained}</td>
                        <td className="px-6 py-3 text-gray-700">{attempt.percentage}%</td>
                        <td className="px-6 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            attempt.status === 'Graded' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {attempt.status}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            attempt.isPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {attempt.isPassed ? '✓ Passed' : '✗ Failed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;
