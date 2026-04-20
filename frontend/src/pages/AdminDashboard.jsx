import React, { useState, useEffect } from 'react';
import { getAdminExams, deleteExam, publishExam, getAdminExamAttempts } from '../utils/api';
import CreateExamModal from '../components/CreateExamModal';
import ManageAdminModal from '../components/ManageAdminModal';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

function AdminDashboard() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    sortBy: 'marks-desc',
    statusFilter: 'all',
    minMarks: 0,
  });

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
      // Reset filters when opening new exam
      setFilterOptions({ sortBy: 'marks-desc', statusFilter: 'all', minMarks: 0 });
    } catch (err) {
      setError('Failed to fetch student attempts');
    } finally {
      setAttemptsLoading(false);
    }
  };

  const getScheduleStatus = (exam) => {
    if (!exam.scheduleStartTime || !exam.scheduleEndTime) {
      return 'Always Available';
    }

    const now = new Date();
    const startTime = new Date(exam.scheduleStartTime);
    const endTime = new Date(exam.scheduleEndTime);

    if (now < startTime) {
      return `Scheduled: ${startTime.toLocaleDateString()} ${startTime.toLocaleTimeString()}`;
    } else if (now > endTime) {
      return 'Expired';
    } else {
      return `Active until ${endTime.toLocaleDateString()} ${endTime.toLocaleTimeString()}`;
    }
  };

  const getFilteredAndSortedAttempts = () => {
    let filtered = [...attempts];

    // Filter by status
    if (filterOptions.statusFilter === 'passed') {
      filtered = filtered.filter(attempt => attempt.isPassed);
    } else if (filterOptions.statusFilter === 'failed') {
      filtered = filtered.filter(attempt => !attempt.isPassed && attempt.status !== 'InProgress');
    } else if (filterOptions.statusFilter === 'inprogress') {
      filtered = filtered.filter(attempt => attempt.status === 'InProgress');
    }

    // Filter by minimum marks
    filtered = filtered.filter(attempt => (attempt.totalMarksObtained || 0) >= filterOptions.minMarks);

    // Sort
    switch (filterOptions.sortBy) {
      case 'marks-desc':
        filtered.sort((a, b) => (b.totalMarksObtained || 0) - (a.totalMarksObtained || 0));
        break;
      case 'marks-asc':
        filtered.sort((a, b) => (a.totalMarksObtained || 0) - (b.totalMarksObtained || 0));
        break;
      case 'percentage-desc':
        filtered.sort((a, b) => (b.percentage || 0) - (a.percentage || 0));
        break;
      case 'name-asc':
        filtered.sort((a, b) => (a.studentId?.name || 'Unknown').localeCompare(b.studentId?.name || 'Unknown'));
        break;
      default:
        break;
    }

    return filtered;
  };

  const exportAttemptsToPDF = () => {
    try {
      const sortedAttempts = getFilteredAndSortedAttempts();
      
      if (!sortedAttempts || sortedAttempts.length === 0) {
        alert('No attempts to export');
        return;
      }

      // Create PDF with A4 page size
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPosition = 15;

      // Title
      pdf.setFontSize(20);
      pdf.setFont(undefined, 'bold');
      pdf.text(selectedExam?.title || 'Exam Results', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 12;

      // Divider line
      pdf.setDrawColor(30, 90, 180);
      pdf.line(20, yPosition, pageWidth - 20, yPosition);
      yPosition += 8;

      // Exam Details Section
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.text('Exam Information:', 20, yPosition);
      yPosition += 6;
      
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Total Marks: ${selectedExam?.totalMarks || 0}`, 25, yPosition);
      yPosition += 5;
      pdf.text(`Total Questions: ${selectedExam?.totalQuestions || 0}`, 25, yPosition);
      yPosition += 5;
      pdf.text(`Exam Date: ${new Date().toLocaleDateString()}`, 25, yPosition);
      yPosition += 8;

      // Divider line
      pdf.setDrawColor(30, 90, 180);
      pdf.line(20, yPosition, pageWidth - 20, yPosition);
      yPosition += 8;
      
      // Filter Information Section
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(11);
      pdf.text('Filters Applied:', 20, yPosition);
      yPosition += 6;
      
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(10);
      
      const sortLabels = {
        'marks-desc': 'Highest Marks',
        'marks-asc': 'Lowest Marks',
        'percentage-desc': 'Highest Percentage',
        'name-asc': 'A-Z Student Name'
      };
      
      const statusLabels = {
        'all': 'All Attempts',
        'passed': 'Passed',
        'failed': 'Failed',
        'inprogress': 'In Progress'
      };
      
      pdf.text(`• Sort: ${sortLabels[filterOptions.sortBy] || filterOptions.sortBy}`, 25, yPosition);
      yPosition += 5;
      pdf.text(`• Status: ${statusLabels[filterOptions.statusFilter] || filterOptions.statusFilter}`, 25, yPosition);
      yPosition += 5;
      pdf.text(`• Min Marks: ${filterOptions.minMarks}`, 25, yPosition);
      yPosition += 5;
      pdf.text(`• Total Shown: ${sortedAttempts.length} of ${attempts.length} attempts`, 25, yPosition);
      yPosition += 10;

      // Divider line
      pdf.setDrawColor(30, 90, 180);
      pdf.line(20, yPosition, pageWidth - 20, yPosition);
      yPosition += 8;

      // Table Header
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.text('Student Attempts:', 20, yPosition);
      yPosition += 8;

      // Create table manually
      const colWidths = [12, 25, 32, 20, 18, 15, 30];
      const colTitles = ['Rank', 'Student Name', 'Email', 'Score', '%', 'Status', 'Attempted At'];
      const rowHeight = 8;
      let xPos = 20;

      // Draw header
      pdf.setFillColor(30, 90, 180);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(9);

      colTitles.forEach((title, idx) => {
        pdf.rect(xPos, yPosition, colWidths[idx], rowHeight, 'F');
        pdf.text(title, xPos + 1, yPosition + 5, { maxWidth: colWidths[idx] - 2 });
        xPos += colWidths[idx];
      });

      yPosition += rowHeight;

      // Draw data rows
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(8);

      sortedAttempts.forEach((attempt, rowIdx) => {
        xPos = 20;
        
        // Alternate row colors
        if (rowIdx % 2 === 0) {
          pdf.setFillColor(245, 245, 245);
          pdf.rect(xPos, yPosition, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
        }

        // Rank (plain number without emojis)
        let rankDisplay = String(rowIdx + 1);
        if (rowIdx === 0) rankDisplay = '1st (Top)';
        else if (rowIdx === 1) rankDisplay = '2nd';
        else if (rowIdx === 2) rankDisplay = '3rd';
        pdf.text(rankDisplay, xPos + 1, yPosition + 5, { maxWidth: colWidths[0] - 2 });
        xPos += colWidths[0];

        // Student Name
        pdf.text(attempt.studentId?.name || 'Unknown', xPos + 1, yPosition + 5, { maxWidth: colWidths[1] - 2 });
        xPos += colWidths[1];

        // Email
        pdf.text(attempt.studentId?.email || 'N/A', xPos + 1, yPosition + 5, { maxWidth: colWidths[2] - 2 });
        xPos += colWidths[2];

        // Score
        const score = `${attempt.totalMarksObtained || 0}/${selectedExam?.totalMarks || 0}`;
        pdf.text(score, xPos + 1, yPosition + 5, { maxWidth: colWidths[3] - 2 });
        xPos += colWidths[3];

        // Percentage
        const percentage = `${attempt.percentage ? attempt.percentage.toFixed(1) : 0}%`;
        pdf.text(percentage, xPos + 1, yPosition + 5, { maxWidth: colWidths[4] - 2 });
        xPos += colWidths[4];

        // Status
        const status = attempt.status === 'InProgress' ? 'In Progress' : attempt.isPassed ? 'Passed' : 'Failed';
        pdf.text(status, xPos + 1, yPosition + 5, { maxWidth: colWidths[5] - 2 });
        xPos += colWidths[5];

        // Attempted At
        const attemptedAt = attempt.startTime ? new Date(attempt.startTime).toLocaleString() : 'N/A';
        pdf.text(attemptedAt, xPos + 1, yPosition + 5, { maxWidth: colWidths[6] - 2 });

        // Draw row borders
        pdf.setDrawColor(200, 200, 200);
        pdf.line(20, yPosition + rowHeight, 20 + colWidths.reduce((a, b) => a + b, 0), yPosition + rowHeight);

        yPosition += rowHeight;
      });

      // Draw outer border
      pdf.setDrawColor(30, 90, 180);
      pdf.setLineWidth(0.5);
      pdf.rect(20, yPosition - (sortedAttempts.length + 1) * rowHeight, colWidths.reduce((a, b) => a + b, 0), (sortedAttempts.length + 1) * rowHeight);

      // Add page number
      yPosition += 10;
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(
        `Page 1 of 1 | Generated on ${new Date().toLocaleDateString()}`,
        20,
        pdf.internal.pageSize.getHeight() - 10
      );

      // Download PDF
      const fileName = `${selectedExam?.title?.replace(/\s+/g, '_') || 'exam'}_results_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF Export Error:', err);
      console.error('Error Stack:', err.stack);
      alert(`Failed to generate PDF: ${err.message || 'Unknown error'}`);
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
          <div className="flex gap-3">
            <button
              onClick={() => setShowAdminModal(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              Manage Admin
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              + Create Exam
            </button>
          </div>
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

        {showAdminModal && (
          <ManageAdminModal
            onClose={() => setShowAdminModal(false)}
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
                    <p className="text-sm text-blue-700 mt-3 font-semibold">
                      <strong>Schedule:</strong> {getScheduleStatus(exam)}
                    </p>
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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 min-h-screen">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 border-b-4 border-blue-800 p-6 flex justify-between items-center shadow-lg">
              <div>
                <h2 className="text-3xl font-bold text-white">{selectedExam?.title}</h2>
                <p className="text-blue-100 text-sm mt-1">Student Attempts Analysis</p>
              </div>
              <div className="flex gap-3 items-center">
                {attempts.length > 0 && (
                  <button
                    onClick={exportAttemptsToPDF}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition flex items-center gap-2"
                  >
                    📄 Export PDF
                  </button>
                )}
                <button
                  onClick={() => setShowAnalysis(false)}
                  className="text-blue-100 hover:text-white text-4xl font-light"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-8">
              {attemptsLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg">Loading attempts...</p>
                </div>
              ) : attempts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <p className="text-gray-600 text-lg">No student attempts yet</p>
                </div>
              ) : (
                <>
                  {/* Filter Section */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl mb-8 border-2 border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-5">Filter & Sort</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
                        <select
                          value={filterOptions.sortBy}
                          onChange={(e) => setFilterOptions(prev => ({ ...prev, sortBy: e.target.value }))}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                        >
                          <option value="marks-desc">Highest Marks</option>
                          <option value="marks-asc">Lowest Marks</option>
                          <option value="percentage-desc">Highest Percentage</option>
                          <option value="name-asc">A-Z Student Name</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Status</label>
                        <select
                          value={filterOptions.statusFilter}
                          onChange={(e) => setFilterOptions(prev => ({ ...prev, statusFilter: e.target.value }))}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                        >
                          <option value="all">All Attempts</option>
                          <option value="passed">Passed</option>
                          <option value="failed">Failed</option>
                          <option value="inprogress">In Progress</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Marks</label>
                        <input
                          type="number"
                          min="0"
                          max={selectedExam?.totalMarks || 100}
                          value={filterOptions.minMarks}
                          onChange={(e) => setFilterOptions(prev => ({ ...prev, minMarks: parseInt(e.target.value) || 0 }))}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                          placeholder="Min marks"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Results Summary */}
                  <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                    <p className="text-gray-800 font-semibold">
                      Showing <span className="text-blue-700 font-bold">{getFilteredAndSortedAttempts().length}</span> of <span className="text-blue-700 font-bold">{attempts.length}</span> attempts
                    </p>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto rounded-xl border-2 border-gray-200">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-100 to-gray-200 border-b-2 border-gray-300">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Rank</th>
                          <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Student Name</th>
                          <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Email</th>
                          <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Score</th>
                          <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Percentage</th>
                          <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Status</th>
                          <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Attempted At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredAndSortedAttempts().length === 0 ? (
                          <tr>
                            <td colSpan="7" className="px-6 py-8 text-center text-gray-600 font-semibold">
                              No attempts match the selected filters
                            </td>
                          </tr>
                        ) : (
                          getFilteredAndSortedAttempts().map((attempt, index) => (
                            <tr key={index} className="border-b border-gray-200 hover:bg-blue-50 transition">
                              <td className="px-6 py-4 text-gray-900 font-bold text-center text-lg">
                                {index + 1}
                                {index === 0 && ' 🏆'}
                                {index === 1 && ' 🥈'}
                                {index === 2 && ' 🥉'}
                              </td>
                              <td className="px-6 py-4 text-gray-900 font-semibold">{attempt.studentId?.name || 'Unknown'}</td>
                              <td className="px-6 py-4 text-gray-600">{attempt.studentId?.email || 'N/A'}</td>
                              <td className="px-6 py-4 text-gray-900 font-bold text-lg">{attempt.totalMarksObtained || 0}/{selectedExam?.totalMarks || 0}</td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full font-bold text-sm ${
                                  (attempt.percentage || 0) >= 80 ? 'bg-green-100 text-green-900' :
                                  (attempt.percentage || 0) >= 60 ? 'bg-blue-100 text-blue-900' :
                                  'bg-orange-100 text-orange-900'
                                }`}>
                                  {attempt.percentage ? attempt.percentage.toFixed(1) : 0}%
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                  attempt.status === 'InProgress'
                                    ? 'bg-yellow-100 text-yellow-900'
                                    : attempt.isPassed
                                    ? 'bg-green-100 text-green-900'
                                    : 'bg-red-100 text-red-900'
                                }`}>
                                  {attempt.status === 'InProgress' ? 'In Progress' : attempt.isPassed ? 'Passed' : 'Failed'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-gray-600 text-sm">
                                {attempt.startTime ? new Date(attempt.startTime).toLocaleString() : 'N/A'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
