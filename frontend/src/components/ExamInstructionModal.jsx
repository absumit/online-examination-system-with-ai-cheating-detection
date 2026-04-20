import React, { useState } from 'react';

function ExamInstructionModal({ exam, onProceed, onCancel }) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  if (!exam) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 min-h-screen">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-8 pb-6 border-b-2 border-gray-200">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">{exam.title}</h2>
          <p className="text-lg text-gray-600">{exam.subject}</p>
        </div>

        <div className="space-y-6 mb-8">
          {/* Exam Duration and Marks */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200 shadow-sm">
              <p className="text-sm font-semibold text-blue-700 mb-1">Total Questions</p>
              <p className="text-3xl font-bold text-blue-900">{exam.totalQuestions}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200 shadow-sm">
              <p className="text-sm font-semibold text-green-700 mb-1">Total Marks</p>
              <p className="text-3xl font-bold text-green-900">{exam.totalMarks}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200 shadow-sm">
              <p className="text-sm font-semibold text-purple-700 mb-1">Duration</p>
              <p className="text-3xl font-bold text-purple-900">{exam.duration} m</p>
            </div>
          </div>

          {/* Passing Score */}
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-500 p-5 rounded-xl shadow-sm">
            <p className="text-sm font-bold text-yellow-800 mb-1">Passing Score Required</p>
            <p className="text-2xl font-bold text-yellow-900">{exam.passingScore} marks ({Math.round((exam.passingScore / exam.totalMarks) * 100)}%)</p>
          </div>

          {/* Negative Marking */}
          {exam.negativeMarking && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 p-5 rounded-xl shadow-sm">
              <h4 className="font-bold text-red-900 mb-2 text-lg">Negative Marking</h4>
              <p className="text-red-800 mb-2">
                <strong className="text-red-900">{exam.negativeMarkingPerQuestion} mark(s)</strong> will be deducted for each wrong answer.
              </p>
              <p className="text-red-700 text-sm">Answer only when you are confident.</p>
            </div>
          )}

          {/* Tab Switch Warning */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500 p-5 rounded-xl shadow-sm">
            <h4 className="font-bold text-orange-900 mb-2 text-lg">Tab Switching Warning</h4>
            <p className="text-orange-800 mb-2">
              Switching tabs or minimizing the exam window is not allowed.
            </p>
            <p className="text-orange-700 text-sm">
              <strong className="text-orange-900">3 warnings</strong> before the exam is automatically submitted.
            </p>
          </div>

          {/* Camera Proctoring */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-l-4 border-indigo-500 p-5 rounded-xl shadow-sm">
            <h4 className="font-bold text-indigo-900 mb-2 text-lg">Camera Proctoring</h4>
            <p className="text-indigo-800 mb-2">
              Your exam may be recorded using your webcam for verification purposes.
            </p>
            <p className="text-indigo-700 text-sm">Ensure proper lighting and face visibility throughout the exam.</p>
          </div>

          {/* Offline Retake Info */}
          {exam.allowOfflineRetake ? (
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-l-4 border-cyan-500 p-5 rounded-xl shadow-sm">
              <h4 className="font-bold text-cyan-900 mb-2 text-lg">Offline Support</h4>
              <p className="text-cyan-800">
                You can continue if internet disconnects. Answers will sync when you reconnect.
              </p>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-l-4 border-gray-400 p-5 rounded-xl shadow-sm">
              <h4 className="font-bold text-gray-900 mb-2 text-lg">Internet Required</h4>
              <p className="text-gray-700">
                If internet is lost, the exam will be automatically submitted with current answers.
              </p>
            </div>
          )}

          {/* General Instructions */}
          <div className="bg-gray-50 border border-gray-300 p-6 rounded-xl shadow-sm">
            <h4 className="font-bold text-gray-900 mb-4 text-lg">Important Instructions</h4>
            <ul className="text-gray-700 space-y-3">
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-3 text-lg">1.</span>
                <span className="text-sm">Once you start the exam, the timer will begin and cannot be paused.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-3 text-lg">2.</span>
                <span className="text-sm">You cannot go back to previous questions unless the exam allows review.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-3 text-lg">3.</span>
                <span className="text-sm">All your answers are auto-saved. You can navigate questions and change answers.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-3 text-lg">4.</span>
                <span className="text-sm">Use only one browser tab for the exam. Switching tabs will trigger warnings.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-3 text-lg">5.</span>
                <span className="text-sm">Ensure your device is fully charged or plugged in before starting.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-3 text-lg">6.</span>
                <span className="text-sm">Use a stable internet connection for the best experience.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Agreement Checkbox */}
        <div className="border-t-2 border-gray-200 pt-6 mb-8">
          <label className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="w-6 h-6 text-blue-600 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-blue-500 group-hover:border-blue-500 transition"
            />
            <span className="ml-3 text-gray-800 font-semibold group-hover:text-blue-600 transition">
              I have read and understood all instructions and exam rules above
            </span>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300 transition duration-200 shadow-sm hover:shadow-md"
          >
            Cancel
          </button>
          <button
            onClick={onProceed}
            disabled={!agreedToTerms}
            className={`flex-1 px-6 py-3 rounded-xl font-bold transition duration-200 shadow-sm ${
              agreedToTerms
                ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md active:scale-95'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            I Agree & Start Exam
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExamInstructionModal;
