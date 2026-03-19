import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExamResult } from '../utils/api';

function ResultsPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchResult = async () => {
      try {
        const response = await getExamResult(attemptId);
        if (!isMounted) return;
        setResult(response.data);
      } catch (err) {
        if (!isMounted) return;
        setError(err.response?.data || 'Failed to fetch result');
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    fetchResult();

    return () => {
      isMounted = false;
    };
  }, [attemptId]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-xl">Loading result...</div>;
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Result Summary */}
        <div className={`rounded-lg shadow-lg p-8 mb-6 ${result.isPassed ? 'bg-green-50 border-l-8 border-green-500' : 'bg-red-50 border-l-8 border-red-500'}`}>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{result.examTitle}</h1>
          
          <div className={`text-6xl font-bold mb-4 ${result.isPassed ? 'text-green-600' : 'text-red-600'}`}>
            {result.percentage}%
          </div>

          <div className={`inline-block px-6 py-2 rounded-full text-white font-bold text-xl mb-6 ${result.isPassed ? 'bg-green-500' : 'bg-red-500'}`}>
            {result.isPassed ? '✓ PASSED' : '✗ FAILED'}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white p-4 rounded-lg">
              <p className="text-gray-600 text-sm font-semibold">Total Marks</p>
              <p className="text-2xl font-bold text-gray-800">{result.totalMarks}</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-gray-600 text-sm font-semibold">Marks Obtained</p>
              <p className="text-2xl font-bold text-gray-800">{result.marksObtained}</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-gray-600 text-sm font-semibold">Correct Answers</p>
              <p className="text-2xl font-bold text-green-600">{result.correctAnswers}</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-gray-600 text-sm font-semibold">Wrong Answers</p>
              <p className="text-2xl font-bold text-red-600">{result.wrongAnswers}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-white p-4 rounded-lg">
              <p className="text-gray-600 text-sm font-semibold">Unanswered</p>
              <p className="text-xl font-bold text-gray-800">{result.unansweredQuestions}</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-gray-600 text-sm font-semibold">Time Taken</p>
              <p className="text-xl font-bold text-gray-800">{Math.floor(result.totalTime / 60)} min</p>
            </div>
          </div>
        </div>

        {/* Answer Review */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Answer Review</h2>
          <div className="space-y-4">
            {result.answers && result.answers.length > 0 ? (
              result.answers.map((answer, idx) => (
                <div
                  key={idx}
                  className={`p-4 border-l-4 rounded-lg ${
                    answer.isCorrect
                      ? 'bg-green-50 border-green-500'
                      : answer.selectedAnswer
                      ? 'bg-red-50 border-red-500'
                      : 'bg-gray-50 border-gray-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">Q{idx + 1}: {answer.questionText}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                      answer.isCorrect ? 'bg-green-500' : answer.selectedAnswer ? 'bg-red-500' : 'bg-gray-500'
                    }`}>
                      {answer.isCorrect ? '✓ Correct' : answer.selectedAnswer ? '✗ Wrong' : 'Unanswered'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Your Answer:</p>
                      <p className="font-semibold text-gray-800">
                        {answer.selectedAnswer || 'Not answered'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Correct Answer:</p>
                      <p className="font-semibold text-gray-800">{answer.correctAnswer}</p>
                    </div>
                  </div>

                  <div className="mt-2 text-sm">
                    <p className="text-gray-600">Marks: <span className="font-semibold">{answer.marksObtained}/{answer.marks}</span></p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-center py-4">No answers to review</p>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={() => navigate('/student/dashboard')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-8 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResultsPage;
