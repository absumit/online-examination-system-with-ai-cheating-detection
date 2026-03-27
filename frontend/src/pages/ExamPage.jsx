import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { startExam, submitAnswer, submitExam, getExamDetails } from '../utils/api';
import api from '../utils/api';

function ExamPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitExam = useCallback(async () => {
    setSubmitting(true);
    try {
      await submitExam(attemptId);
      navigate(`/student/result/${attemptId}`);
    } catch (err) {
      setError(err.response?.data || 'Failed to submit exam');
      setSubmitting(false);
    }
  }, [attemptId, navigate]);

  const initializeExam = useCallback(async () => {
    try {
      setLoading(true);
      const examResponse = await getExamDetails(examId);
      setExam(examResponse.data);

      const attemptResponse = await startExam(examId);
      setAttemptId(attemptResponse.data.attemptId);
      setTimeLeft(examResponse.data.duration * 60);

      const initialAnswers = {};
      examResponse.data.questions.forEach((_, idx) => {
        initialAnswers[idx] = '';
      });
      setAnswers(initialAnswers);
    } catch (err) {
      setError(err.response?.data || 'Failed to load exam');
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    initializeExam();
  }, [initializeExam]);

  // Detect tab switch/minimize
  useEffect(() => {
    if (!attemptId) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched away from exam tab
        api.post(`/student/exam/attempt/${attemptId}/flag-tab-switch`)
          .then(response => {
            if (response.data.autoSubmitted) {
              // Auto-submitted due to threshold exceeded
              alert('⚠️ Suspicious activity detected. Your exam has been auto-submitted.');
              setTimeout(() => {
                navigate(`/student/result/${attemptId}`);
              }, 1000);
            }
          })
          .catch(err => console.error('Failed to flag tab switch:', err));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [attemptId, navigate]);

  useEffect(() => {
    if (timeLeft <= 0 || !attemptId) return;

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          handleSubmitExam();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, attemptId, handleSubmitExam]);

  const handleAnswerChange = (answer) => {
    const newAnswers = { ...answers, [currentQuestion]: answer };
    setAnswers(newAnswers);

    // Auto-save answer
    submitAnswer(attemptId, {
      questionIndex: currentQuestion,
      selectedAnswer: answer
    }).catch(err => console.error('Failed to save answer:', err));
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-xl">Loading exam...</div>;
  }

  if (!exam) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error || 'Exam not found'}</p>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const question = exam.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{exam.title}</h1>
            <p className="text-gray-600">{exam.subject}</p>
          </div>
          <div className={`text-3xl font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-gray-800'}`}>
            {formatTime(timeLeft)}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Questions List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-4">
            <h3 className="font-bold text-gray-800 mb-4">Questions</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {exam.questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestion(idx)}
                  className={`w-full px-3 py-2 rounded-lg font-semibold transition ${
                    currentQuestion === idx
                      ? 'bg-blue-500 text-white'
                      : answers[idx]
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Q{idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Question Panel */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Question {currentQuestion + 1} of {exam.questions.length}
              </h2>
              <p className="text-sm text-gray-600">Marks: {question.marks}</p>
            </div>

            <div className="mb-6">
              <p className="text-lg text-gray-800 font-semibold mb-4">{question.questionText}</p>

              <div className="space-y-3">
                {question.options.map((option, idx) => (
                  <label key={idx} className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 transition">
                    <input
                      type="radio"
                      name={`question-${currentQuestion}`}
                      value={option}
                      checked={answers[currentQuestion] === option}
                      onChange={() => handleAnswerChange(option)}
                      className="mr-3 w-4 h-4"
                    />
                    <span className="text-gray-800">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
                className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-bold py-2 px-6 rounded-lg transition"
              >
                ← Previous
              </button>
              <button
                onClick={() => setCurrentQuestion(Math.min(exam.questions.length - 1, currentQuestion + 1))}
                disabled={currentQuestion === exam.questions.length - 1}
                className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-bold py-2 px-6 rounded-lg transition"
              >
                Next →
              </button>
              <button
                onClick={handleSubmitExam}
                disabled={submitting}
                className="ml-auto bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-lg transition"
              >
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExamPage;
