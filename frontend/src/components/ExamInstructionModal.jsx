import React, { useState } from 'react';

function ExamInstructionModal({ exam, onProceed, onCancel }) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  if (!exam) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center px-4 py-4 z-50 min-h-screen overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8 pb-4 sm:pb-6 border-b-2 border-gray-200">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">{exam.title}</h2>
          <p className="text-base sm:text-lg text-gray-600">{exam.subject}</p>
        </div>

        <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
          {/* Exam Duration and Marks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-5 rounded-xl border border-blue-200 shadow-sm">
              <p className="text-xs sm:text-sm font-semibold text-blue-700 mb-1">Total Questions</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-900">{exam.totalQuestions}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-5 rounded-xl border border-green-200 shadow-sm">
              <p className="text-xs sm:text-sm font-semibold text-green-700 mb-1">Total Marks</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-900">{exam.totalMarks}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-5 rounded-xl border border-purple-200 shadow-sm">
              <p className="text-xs sm:text-sm font-semibold text-purple-700 mb-1">Duration</p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-900">{exam.duration} m</p>
            </div>
          </div>

          {/* Passing Score */}
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-500 p-3 sm:p-5 rounded-xl shadow-sm">
            <p className="text-xs sm:text-sm font-bold text-yellow-800 mb-1">Passing Score Required</p>
            <p className="text-lg sm:text-2xl font-bold text-yellow-900">{exam.passingScore} marks ({Math.round((exam.passingScore / exam.totalMarks) * 100)}%)</p>
          </div>

          {/* Negative Marking */}
          {exam.negativeMarking && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 p-3 sm:p-5 rounded-xl shadow-sm">
              <h4 className="font-bold text-red-900 mb-1 sm:mb-2 text-base sm:text-lg">Negative Marking</h4>
              <p className="text-xs sm:text-sm text-red-800 mb-1 sm:mb-2">
                <strong className="text-red-900">{exam.negativeMarkingPerQuestion} mark(s)</strong> will be deducted for each wrong answer.
              </p>
              <p className="text-red-700 text-xs">Answer only when you are confident.</p>
            </div>
          )}

          {/* Tab Switch Warning */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500 p-3 sm:p-5 rounded-xl shadow-sm">
            <h4 className="font-bold text-orange-900 mb-1 sm:mb-2 text-base sm:text-lg">Tab Switching Warning</h4>
            <p className="text-xs sm:text-sm text-orange-800 mb-1">
              Switching tabs or minimizing the exam window is not allowed.
            </p>
            <p className="text-xs sm:text-sm text-orange-700">
              <strong className="text-orange-900">3 warnings</strong> before the exam is automatically submitted.
            </p>
          </div>

          {/* Camera Proctoring */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-l-4 border-indigo-500 p-3 sm:p-5 rounded-xl shadow-sm">
            <h4 className="font-bold text-indigo-900 mb-1 sm:mb-2 text-base sm:text-lg">Camera Proctoring</h4>
            <p className="text-xs sm:text-sm text-indigo-800 mb-1">
              Your exam may be recorded using your webcam for verification purposes.
            </p>
            <p className="text-xs sm:text-sm text-indigo-700">Ensure proper lighting and face visibility throughout the exam.</p>
          </div>

          {/* Offline Retake Info */}
          {exam.allowOfflineRetake ? (
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-l-4 border-cyan-500 p-3 sm:p-5 rounded-xl shadow-sm">
              <h4 className="font-bold text-cyan-900 mb-1 sm:mb-2 text-base sm:text-lg">Offline Support</h4>
              <p className="text-xs sm:text-sm text-cyan-800">
                You can continue if internet disconnects. Answers will sync when you reconnect.
              </p>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-l-4 border-gray-400 p-3 sm:p-5 rounded-xl shadow-sm">
              <h4 className="font-bold text-gray-900 mb-1 sm:mb-2 text-base sm:text-lg">Internet Required</h4>
              <p className="text-xs sm:text-sm text-gray-700">
                If internet is lost, the exam will be automatically submitted with current answers.
              </p>
            </div>
          )}

          {/* General Instructions */}
          <div className="bg-gray-50 border border-gray-300 p-4 sm:p-6 rounded-xl shadow-sm">
            <h4 className="font-bold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">Important Instructions</h4>
            <ul className="text-gray-700 space-y-2 sm:space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold text-sm sm:text-lg flex-shrink-0">1.</span>
                <span className="text-xs sm:text-sm">Once you start the exam, the timer will begin and cannot be paused.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold text-sm sm:text-lg flex-shrink-0">2.</span>
                <span className="text-xs sm:text-sm">You cannot go back to previous questions unless the exam allows review.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold text-sm sm:text-lg flex-shrink-0">3.</span>
                <span className="text-xs sm:text-sm">All your answers are auto-saved. You can navigate questions and change answers.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold text-sm sm:text-lg flex-shrink-0">4.</span>
                <span className="text-xs sm:text-sm">Use only one browser tab for the exam. Switching tabs will trigger warnings.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold text-sm sm:text-lg flex-shrink-0">5.</span>
                <span className="text-xs sm:text-sm">Ensure your device is fully charged or plugged in before starting.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold text-sm sm:text-lg flex-shrink-0">6.</span>
                <span className="text-xs sm:text-sm">Use a stable internet connection for the best experience.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Agreement Checkbox */}
        <div className="border-t-2 border-gray-200 pt-4 sm:pt-6 mb-6 sm:mb-8">
          <label className="flex items-start sm:items-center cursor-pointer group gap-2 sm:gap-3">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="w-4 sm:w-6 h-4 sm:h-6 text-blue-600 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-blue-500 group-hover:border-blue-500 transition flex-shrink-0 mt-0.5 sm:mt-0"
            />
            <span className="text-xs sm:text-base text-gray-800 font-semibold group-hover:text-blue-600 transition">
              I have read and understood all instructions and exam rules above
            </span>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <button
            onClick={onCancel}
            className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300 transition duration-200 shadow-sm hover:shadow-md text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={onProceed}
            disabled={!agreedToTerms}
            className={`flex-1 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold transition duration-200 shadow-sm text-sm sm:text-base ${
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
