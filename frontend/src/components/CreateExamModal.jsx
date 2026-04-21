import React, { useState } from 'react';
import { createExam, importExamQuestions } from '../utils/api';

function CreateExamModal({ onClose, onExamCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    duration: 60,
    totalMarks: 100,
    passingScore: 40,
    difficulty: 'Medium',
    negativeMarking: false,
    negativeMarkingPerQuestion: 0,
    allowOfflineRetake: false,
    scheduleStartTime: '',
    scheduleEndTime: '',
  });
  const [questions, setQuestions] = useState([
    { questionText: '', options: ['', '', '', ''], correctAnswer: '', correctAnswers: [] }
  ]);
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleCorrectAnswerChange = (qIndex, answer) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].correctAnswer = answer;
    setQuestions(newQuestions);
  };

  const handleMultipleAnswerToggle = (qIndex, answer) => {
    const newQuestions = [...questions];
    const correctAnswers = newQuestions[qIndex].correctAnswers || [];
    const index = correctAnswers.indexOf(answer);
    
    if (index > -1) {
      correctAnswers.splice(index, 1);
    } else {
      correctAnswers.push(answer);
    }
    
    newQuestions[qIndex].correctAnswers = correctAnswers;
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([...questions, { questionText: '', options: ['', '', '', ''], correctAnswer: '', correctAnswers: [] }]);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleImportQuestions = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setError('');
    setImportLoading(true);

    try {
      const response = await importExamQuestions(file);
      const importedQuestions = response.data?.questions || [];

      if (!importedQuestions.length) {
        setError('No questions found in the uploaded file');
        return;
      }

      const normalizedQuestions = importedQuestions
        .map((q) => {
          const options = (q.options || [])
            .map((opt) => String(opt || '').trim())
            .filter(Boolean)
            .slice(0, 4);

          while (options.length < 4) {
            options.push('');
          }

          return {
            questionText: String(q.questionText || '').trim(),
            options,
            correctAnswer: q.correctAnswer || '', // Use extracted answer if available
            correctAnswers: q.correctAnswers || [] // Include multiple answers if available
          };
        })
        .filter((q) => q.questionText && q.options.filter(Boolean).length >= 2);

      if (!normalizedQuestions.length) {
        setError('Uploaded file did not contain valid multiple-choice questions');
        return;
      }

      setQuestions(normalizedQuestions);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data || 'Failed to import questions';
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    } finally {
      setImportLoading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const examData = {
        ...formData,
        questions: questions.map(q => ({
          questionText: q.questionText,
          options: q.options.map(o => o.trim()).filter(o => o),
          correctAnswer: q.correctAnswer,
          correctAnswers: q.correctAnswers || [],
          marks: Math.floor(formData.totalMarks / questions.length)
        }))
      };

      await createExam(examData);
      onExamCreated();
    } catch (err) {
      setError(err.response?.data || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center px-4 py-4 z-50 min-h-screen overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 pb-4 sm:pb-6 border-b-2 border-gray-200 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Create New Exam</h2>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">Fill in all details to create a new exam</p>
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

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Basic Info Section */}
          <div className="bg-gray-50 p-4 sm:p-6 rounded-xl border border-gray-200">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm text-gray-700 font-semibold mb-1 sm:mb-2">Exam Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  className="w-full px-2 sm:px-4 py-1.5 sm:py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-xs sm:text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-gray-700 font-semibold mb-1 sm:mb-2">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleFormChange}
                  className="w-full px-2 sm:px-4 py-1.5 sm:py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-xs sm:text-base"
                  required
                />
              </div>

              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs sm:text-sm text-gray-700 font-semibold mb-1 sm:mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  className="w-full px-2 sm:px-4 py-1.5 sm:py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-xs sm:text-base"
                  rows="3"
                />
              </div>
            </div>
          </div>

          {/* Exam Settings Section */}
          <div className="bg-gray-50 p-4 sm:p-6 rounded-xl border border-gray-200">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Exam Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm text-gray-700 font-semibold mb-1 sm:mb-2">Duration (min)</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleFormChange}
                  className="w-full px-2 sm:px-4 py-1.5 sm:py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-xs sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-gray-700 font-semibold mb-1 sm:mb-2">Total Marks</label>
                <input
                  type="number"
                  name="totalMarks"
                  value={formData.totalMarks}
                  onChange={handleFormChange}
                  className="w-full px-2 sm:px-4 py-1.5 sm:py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-xs sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-gray-700 font-semibold mb-1 sm:mb-2">Passing Score</label>
                <input
                  type="number"
                  name="passingScore"
                  value={formData.passingScore}
                  onChange={handleFormChange}
                  className="w-full px-2 sm:px-4 py-1.5 sm:py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-xs sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-gray-700 font-semibold mb-1 sm:mb-2">Difficulty</label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleFormChange}
                  className="w-full px-2 sm:px-4 py-1.5 sm:py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-xs sm:text-base"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>
          </div>

          {/* Marking Options Section */}
          <div className="bg-gray-50 p-4 sm:p-6 rounded-xl border border-gray-200">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Marking Options</h3>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="negativeMarking"
                    checked={formData.negativeMarking}
                    onChange={(e) => setFormData(prev => ({ ...prev, negativeMarking: e.target.checked }))}
                    className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 sm:ml-3 text-xs sm:text-base text-gray-700 font-semibold">Enable Negative Marking</span>
                </label>
                <p className="text-gray-600 text-xs ml-6 sm:ml-8 mt-1">Apply negative marks for wrong answers</p>
              </div>

              {formData.negativeMarking && (
                <div className="ml-6 sm:ml-8 bg-white p-3 sm:p-4 rounded-lg border-2 border-yellow-300">
                  <label className="block text-xs sm:text-sm text-gray-700 font-semibold mb-1 sm:mb-2">Negative Marks Per Wrong Answer</label>
                  <input
                    type="number"
                    name="negativeMarkingPerQuestion"
                    value={formData.negativeMarkingPerQuestion}
                    onChange={handleFormChange}
                    className="w-full px-2 sm:px-4 py-1.5 sm:py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-xs sm:text-base"
                    placeholder="e.g., 0.25"
                    step="0.01"
                    min="0"
                  />
                </div>
              )}

              <div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="allowOfflineRetake"
                    checked={formData.allowOfflineRetake}
                    onChange={(e) => setFormData(prev => ({ ...prev, allowOfflineRetake: e.target.checked }))}
                    className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 sm:ml-3 text-xs sm:text-base text-gray-700 font-semibold">Allow Offline Retake</span>
                </label>
                <p className="text-gray-600 text-xs ml-6 sm:ml-8 mt-1">If unchecked, exam auto-submits on internet loss</p>
              </div>
            </div>
          </div>

          {/* Exam Scheduling Section */}
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-4 sm:p-6 rounded-xl border border-cyan-200">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-4">Exam Schedule (Optional)</h3>
            <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">Set a time window when students can take this exam. Leave empty for always available.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm text-gray-700 font-semibold mb-1 sm:mb-2">Start Time</label>
                <input
                  type="datetime-local"
                  name="scheduleStartTime"
                  value={formData.scheduleStartTime}
                  onChange={handleFormChange}
                  className="w-full px-2 sm:px-4 py-1.5 sm:py-2 border-2 border-cyan-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-xs sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-gray-700 font-semibold mb-1 sm:mb-2">End Time</label>
                <input
                  type="datetime-local"
                  name="scheduleEndTime"
                  value={formData.scheduleEndTime}
                  onChange={handleFormChange}
                  className="w-full px-2 sm:px-4 py-1.5 sm:py-2 border-2 border-cyan-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-xs sm:text-base"
                />
              </div>
            </div>
            {formData.scheduleStartTime && formData.scheduleEndTime && (
              <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-100 border border-blue-300 rounded-lg">
                <p className="text-blue-800 text-xs sm:text-sm">
                  <strong>Window:</strong> {new Date(formData.scheduleStartTime).toLocaleString()} to {new Date(formData.scheduleEndTime).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <div className="border-t-2 border-gray-200 pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Questions</h3>
              <label className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg transition cursor-pointer shadow-sm hover:shadow-md text-xs sm:text-base">
                {importLoading ? 'Importing...' : 'Import PDF/DOCX'}
                <input
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleImportQuestions}
                  className="hidden"
                  disabled={importLoading || loading}
                />
              </label>
            </div>
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="mb-4 sm:mb-6 p-3 sm:p-5 bg-white rounded-xl border-2 border-gray-300 hover:border-blue-400 transition">
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <h4 className="font-bold text-gray-900 text-base sm:text-lg">Question {qIndex + 1}</h4>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIndex)}
                      className="text-red-600 hover:text-red-800 font-bold hover:bg-red-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg transition text-xs sm:text-base"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Question text"
                  value={q.questionText}
                  onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                  className="w-full px-2 sm:px-4 py-1.5 sm:py-2 border-2 border-gray-300 rounded-lg mb-3 sm:mb-4 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-xs sm:text-base"
                  required
                />

                <div className="space-y-2 mb-3 sm:mb-4">
                  {q.options.map((opt, oIndex) => (
                    <input
                      key={oIndex}
                      type="text"
                      placeholder={`Option ${oIndex + 1}`}
                      value={opt}
                      onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                      className="w-full px-2 sm:px-4 py-1.5 sm:py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-xs sm:text-base"
                      required
                    />
                  ))}
                </div>

                <div className="mb-3 sm:mb-4">
                  <label className="block text-xs sm:text-sm text-gray-700 font-semibold mb-1 sm:mb-2">Correct Answer (Primary)</label>
                  <select
                    value={q.correctAnswer}
                    onChange={(e) => handleCorrectAnswerChange(qIndex, e.target.value)}
                    className="w-full px-2 sm:px-4 py-1.5 sm:py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-xs sm:text-base"
                    required
                  >
                    <option value="">Select primary answer</option>
                    {q.options.map((opt, idx) => (
                      <option key={idx} value={opt}>
                        {opt || `Option ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3 sm:mb-4">
                  <label className="block text-xs sm:text-sm text-gray-700 font-semibold mb-2 sm:mb-3">Mark all correct answers</label>
                  <div className="space-y-1 sm:space-y-2 bg-gray-50 p-2 sm:p-3 rounded-lg border border-gray-200">
                    {q.options.map((opt, idx) => (
                      <label key={idx} className="flex items-center cursor-pointer p-1 sm:p-2 hover:bg-gray-100 rounded transition">
                        <input
                          type="checkbox"
                          checked={(q.correctAnswers || []).includes(opt)}
                          onChange={() => handleMultipleAnswerToggle(qIndex, opt)}
                          className="w-3 sm:w-4 h-3 sm:h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="ml-1 sm:ml-2 text-xs sm:text-base text-gray-700">{opt || `Option ${idx + 1}`}</span>
                        {q.correctAnswer === opt && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">Primary</span>}
                      </label>
                    ))}
                  </div>
                  {(q.correctAnswers || []).length > 0 && (
                    <p className="text-xs sm:text-sm text-blue-600 mt-1 sm:mt-2">Selected: {(q.correctAnswers || []).join(', ')}</p>
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addQuestion}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition shadow-sm hover:shadow-md text-sm sm:text-base"
            >
              + Add Question
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end border-t-2 border-gray-200 pt-4 sm:pt-6">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 sm:py-3 px-4 sm:px-8 rounded-lg transition shadow-sm hover:shadow-md text-sm sm:text-base w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-8 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md text-sm sm:text-base w-full sm:w-auto"
            >
              {loading ? 'Creating...' : 'Create Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateExamModal;
