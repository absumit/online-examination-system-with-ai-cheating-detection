import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { startExam, submitAnswer, submitExam, getExamDetails } from '../utils/api';
import api from '../utils/api';
import ExamInstructionModal from '../components/ExamInstructionModal';

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
  const [tabSwitchWarnings, setTabSwitchWarnings] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notification, setNotification] = useState('');
  const [notificationType, setNotificationType] = useState(''); // 'error', 'warning', 'success'
  const [instructionsAcknowledged, setInstructionsAcknowledged] = useState(false);
  const [examLoaded, setExamLoaded] = useState(false);

  // Show notification
  const showNotification = useCallback((msg, type = 'info') => {
    setNotification(msg);
    setNotificationType(type);
    setTimeout(() => setNotification(''), 5000);
  }, []);

  // Save answers to local storage
  const saveAnswersToLocal = useCallback((currentAnswers, currentAttemptId) => {
    if (currentAttemptId) {
      localStorage.setItem(`exam_answers_${currentAttemptId}`, JSON.stringify(currentAnswers));
    }
  }, []);



  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showNotification('Internet connection restored!', 'success');
    };

    const handleOffline = () => {
      setIsOnline(false);
      showNotification('Internet connection lost. Your answers are being saved locally.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showNotification]);

  const handleSubmitExam = useCallback(async () => {
    // If offline and auto-submit enabled
    if (!isOnline && exam && !exam.allowOfflineRetake) {
      showNotification('Internet lost. Exam will be auto-submitted with current answers.', 'warning');
      // Still save to local storage as backup
      saveAnswersToLocal(answers, attemptId);
      return;
    }

    setSubmitting(true);
    try {
      await submitExam(attemptId);
      localStorage.removeItem(`exam_answers_${attemptId}`);
      navigate(`/student/result/${attemptId}`);
    } catch (err) {
      const errorMsg = err.response?.data || 'Failed to submit exam';
      setError(errorMsg);
      showNotification('Error submitting exam. Will retry when connected.', 'error');
      setSubmitting(false);
      
      // Save to local storage for retry
      saveAnswersToLocal(answers, attemptId);
    }
  }, [attemptId, navigate, answers, isOnline, exam, showNotification, saveAnswersToLocal]);

  const initializeExam = useCallback(async () => {
    try {
      setLoading(true);
      const examResponse = await getExamDetails(examId);
      setExam(examResponse.data);
      setExamLoaded(true);
    } catch (err) {
      setError(err.response?.data || 'Failed to load exam');
    } finally {
      setLoading(false);
    }
  }, [examId]);

  const handleProceedWithExam = useCallback(async () => {
    try {
      setLoading(true);
      const examResponse = await getExamDetails(examId);
      
      const attemptResponse = await startExam(examId);
      setAttemptId(attemptResponse.data.attemptId);
      setTimeLeft(examResponse.data.duration * 60);

      // Initialize answers as empty
      // Single answer: empty string ''
      // Multiple answers: empty array []
      const initialAnswers = {};
      examResponse.data.questions.forEach((question, idx) => {
        initialAnswers[idx] = question.multipleAnswersAllowed ? [] : '';
      });
      setAnswers(initialAnswers);
      setInstructionsAcknowledged(true);
    } catch (err) {
      setError(err.response?.data || 'Failed to start exam');
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
        const newWarningCount = tabSwitchWarnings + 1;
        setTabSwitchWarnings(newWarningCount);
        
        const threshold = 3; // Default threshold
        const remaining = threshold - newWarningCount;
        
        // Show warning popup
        if (remaining > 0) { 
          alert(`WARNING: Switching tabs is not allowed!\n\nYou have ${remaining} warning(s) remaining before auto-submission.`);
        }
        
        // Send to backend
        api.post(`/student/exam/attempt/${attemptId}/flag-tab-switch`)
          .then(response => {
            if (response.data.autoSubmitted) {
              // Auto-submitted due to threshold exceeded
              alert('Exam auto-submitted due to suspicious activity. Your exam has been ended.');
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
  }, [attemptId, navigate, tabSwitchWarnings]);

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

    // Always save to local storage first
    saveAnswersToLocal(newAnswers, attemptId);

    // Try to auto-save to server if online
    if (isOnline) {
      submitAnswer(attemptId, {
        questionIndex: currentQuestion,
        selectedAnswer: answer
      }).catch(err => {
        showNotification('Answer saved locally. Will sync when connected.', 'warning');
        console.error('Failed to save answer to server:', err);
      });
    } else {
      showNotification('Offline: Answer saved locally.', 'warning');
    }
  };

  const handleMultipleAnswerChange = (answer) => {
    const newAnswers = { ...answers };
    const currentAnswers = Array.isArray(newAnswers[currentQuestion]) 
      ? newAnswers[currentQuestion] 
      : [];
    
    const index = currentAnswers.indexOf(answer);
    if (index > -1) {
      currentAnswers.splice(index, 1);
    } else {
      currentAnswers.push(answer);
    }
    
    newAnswers[currentQuestion] = currentAnswers;
    setAnswers(newAnswers);

    // Always save to local storage first
    saveAnswersToLocal(newAnswers, attemptId);

    // Try to auto-save to server if online
    if (isOnline && attemptId) {
      submitAnswer(attemptId, {
        questionIndex: currentQuestion,
        selectedAnswer: currentAnswers.length > 0 ? currentAnswers : []
      }).catch(err => {
        console.error('Failed to save answer to server:', err);
        showNotification('Answer saved locally. Will sync when connected.', 'warning');
      });
    } else if (!isOnline) {
      showNotification('Offline: Answer saved locally.', 'warning');
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Show instruction modal if exam is loaded but not acknowledged
  if (examLoaded && !instructionsAcknowledged && exam) {
    return (
      <ExamInstructionModal 
        exam={exam}
        onProceed={handleProceedWithExam}
        onCancel={() => navigate('/student/dashboard')}
      />
    );
  }

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
          <div className="flex items-center gap-4">
            <button
              onClick={handleSubmitExam}
              disabled={submitting}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              {submitting ? 'Submitting...' : 'Submit Exam'}
            </button>
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                isOnline
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className={`text-3xl font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-gray-800'}`}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Notifications */}
        {notification && (
          <div className={`p-4 rounded mb-4 border ${
            notificationType === 'error' ? 'bg-red-100 border-red-400 text-red-700' :
            notificationType === 'warning' ? 'bg-yellow-100 border-yellow-400 text-yellow-700' :
            notificationType === 'success' ? 'bg-green-100 border-green-400 text-green-700' :
            'bg-blue-100 border-blue-400 text-blue-700'
          }`}>
            {notification}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Offline Retake Notice */}
        {!isOnline && exam && exam.allowOfflineRetake && (
          <div className="bg-blue-50 border border-blue-300 text-blue-700 px-4 py-3 rounded mb-4">
            You are offline but can continue. Your answers will sync when you reconnect.
          </div>
        )}

        {!isOnline && exam && !exam.allowOfflineRetake && (
          <div className="bg-yellow-50 border border-yellow-300 text-yellow-700 px-4 py-3 rounded mb-4">
            You are offline. This exam will be auto-submitted if connection is not restored.
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
                  className={`w-full px-3 py-2 rounded-lg font-semibold transition relative ${
                    currentQuestion === idx
                      ? 'bg-blue-500 text-white'
                      : (Array.isArray(answers[idx]) ? answers[idx].length > 0 : answers[idx])
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Q{idx + 1}
                  {exam.questions[idx].multipleAnswersAllowed && (
                    <span className="text-xs ml-1 font-bold" title="Multiple correct answers">◆</span>
                  )}
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
              {question.multipleAnswersAllowed && (
                <p className="text-sm text-blue-600 mb-3 font-semibold">⚠️ This question has multiple correct answers - select all that apply</p>
              )}

              <div className="space-y-3">
                {question.options.map((option, idx) => (
                  <label key={idx} className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 transition">
                    <input
                      type={question.multipleAnswersAllowed ? "checkbox" : "radio"}
                      name={`question-${currentQuestion}`}
                      value={option}
                      checked={
                        question.multipleAnswersAllowed 
                          ? Array.isArray(answers[currentQuestion]) && answers[currentQuestion].includes(option)
                          : answers[currentQuestion] === option
                      }
                      onChange={() => 
                        question.multipleAnswersAllowed 
                          ? handleMultipleAnswerChange(option)
                          : handleAnswerChange(option)
                      }
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
                className="ml-auto bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-bold py-2 px-6 rounded-lg transition"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExamPage;
