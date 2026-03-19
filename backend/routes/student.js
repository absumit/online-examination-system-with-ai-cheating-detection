const express = require('express');
const router = express.Router();
const exam = require("../models/exam");
const exam_attempt = require("../models/exam_attempt");

// Middleware - Authentication & Authorization (will be applied in server.js)

// Get All Published Exams (Students)
router.get('/exams', async (req, res) => {
  try {
    const publishedExams = await exam.find({ isPublished: true, status: 'Active' }).select('-questions');
    res.send(publishedExams);
  }
  catch (err) {
    res.status(500).send("Error fetching exams: " + err.message);
  }
});

// Get Specific Exam for Taking (Student)
router.get('/exam/:examId', async (req, res) => {
  try {
    const examId = req.params.examId;
    const examData = await exam.findById(examId);

    if (!examData) {
      return res.status(404).send("Exam not found");
    }

    if (!examData.isPublished || examData.status !== 'Active') {
      return res.status(403).send("This exam is not available");
    }

    // Check attempt limit
    const attemptCount = await exam_attempt.countDocuments({ examId, studentId: req.user._id });
    if (attemptCount >= examData.maxAttempts) {
      return res.status(403).send("You have exhausted your attempt limit for this exam");
    }

    // Return exam without correct answers
    const safeExam = {
      ...examData.toObject(),
      questions: examData.questions.map(q => ({
        _id: q._id,
        questionText: q.questionText,
        options: q.options,
        marks: q.marks
      }))
    };

    res.send(safeExam);
  }
  catch (err) {
    res.status(500).send("Error fetching exam: " + err.message);
  }
});

// Start Exam / Create Exam Attempt (Student)
router.post('/exam/:examId/start', async (req, res) => {
  try {
    const examId = req.params.examId;
    const examData = await exam.findById(examId);

    if (!examData) {
      return res.status(404).send("Exam not found");
    }

    if (!examData.isPublished || examData.status !== 'Active') {
      return res.status(403).send("This exam is not available");
    }

    // Check attempt limit
    const attemptCount = await exam_attempt.countDocuments({ examId, studentId: req.user._id });
    if (attemptCount >= examData.maxAttempts) {
      return res.status(403).send("You have exhausted your attempt limit for this exam");
    }

    // Check for ongoing attempt
    const ongoingAttempt = await exam_attempt.findOne({
      examId,
      studentId: req.user._id,
      status: 'InProgress'
    });

    if (ongoingAttempt) {
      return res.send({ message: "Ongoing exam found", attemptId: ongoingAttempt._id });
    }

    // Create new attempt
    const newAttempt = await exam_attempt.create({
      examId,
      studentId: req.user._id,
      totalQuestions: examData.totalQuestions,
      startTime: new Date(),
      answers: examData.questions.map(q => ({
        questionId: q._id,
        questionText: q.questionText,
        marks: q.marks,
        selectedAnswer: null,
        correctAnswer: q.correctAnswer,
        isCorrect: false,
        marksObtained: 0
      }))
    });

    res.status(201).send({ message: "Exam started", attemptId: newAttempt._id });
  }
  catch (err) {
    res.status(500).send("Error starting exam: " + err.message);
  }
});

// Submit Answer (Student - during exam)
router.put('/exam/attempt/:attemptId/answer', async (req, res) => {
  try {
    const attemptId = req.params.attemptId;
    const { questionIndex, selectedAnswer } = req.body;

    if (questionIndex === undefined || !selectedAnswer) {
      return res.status(400).send("questionIndex and selectedAnswer are required");
    }

    const attempt = await exam_attempt.findById(attemptId);

    if (!attempt) {
      return res.status(404).send("Attempt not found");
    }

    if (attempt.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).send("You can only answer your own exams");
    }

    if (attempt.status !== 'InProgress') {
      return res.status(400).send("This exam is not in progress");
    }

    // Update answer
    if (attempt.answers[questionIndex]) {
      attempt.answers[questionIndex].selectedAnswer = selectedAnswer;
    }

    await attempt.save();
    res.send({ message: "Answer submitted", success: true });
  }
  catch (err) {
    res.status(500).send("Error submitting answer: " + err.message);
  }
});

// Submit/Complete Exam (Student)
router.post('/exam/attempt/:attemptId/submit', async (req, res) => {
  try {
    const attemptId = req.params.attemptId;

    const attempt = await exam_attempt.findById(attemptId);

    if (!attempt) {
      return res.status(404).send("Attempt not found");
    }

    if (attempt.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).send("You can only submit your own exams");
    }

    if (attempt.status !== 'InProgress') {
      return res.status(400).send("This exam is not in progress");
    }

    const examData = await exam.findById(attempt.examId);

    // Calculate marks and results
    let totalMarksObtained = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    attempt.answers.forEach(answer => {
      if (!answer.selectedAnswer) {
        unansweredCount++;
      } else if (answer.selectedAnswer === answer.correctAnswer) {
        correctCount++;
        totalMarksObtained += answer.marks || 0;
        answer.isCorrect = true;
        answer.marksObtained = answer.marks || 0;
      } else {
        wrongCount++;
        answer.isCorrect = false;
        answer.marksObtained = 0;
      }
    });

    const percentage = (totalMarksObtained / examData.totalMarks) * 100;
    const isPassed = totalMarksObtained >= examData.passingScore;

    // Update attempt
    attempt.endTime = new Date();
    attempt.totalMarksObtained = totalMarksObtained;
    attempt.correctAnswers = correctCount;
    attempt.wrongAnswers = wrongCount;
    attempt.unansweredQuestions = unansweredCount;
    attempt.percentage = percentage.toFixed(2);
    attempt.isPassed = isPassed;
    attempt.status = 'Graded';
    attempt.totalTime = Math.floor((attempt.endTime - attempt.startTime) / 1000); // in seconds

    await attempt.save();

    const result = {
      message: "Exam submitted successfully",
      result: {
        totalMarks: examData.totalMarks,
        marksObtained: totalMarksObtained,
        percentage: percentage.toFixed(2),
        correctAnswers: correctCount,
        wrongAnswers: wrongCount,
        unansweredQuestions: unansweredCount,
        isPassed: isPassed,
        totalTime: attempt.totalTime
      }
    };

    res.send(result);
  }
  catch (err) {
    res.status(500).send("Error submitting exam: " + err.message);
  }
});

// Get Exam Results (Student)
router.get('/exam/attempt/:attemptId/result', async (req, res) => {
  try {
    const attemptId = req.params.attemptId;

    const attempt = await exam_attempt.findById(attemptId);

    if (!attempt) {
      return res.status(404).send("Attempt not found");
    }

    if (attempt.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).send("You can only view your own results");
    }

    const examData = await exam.findById(attempt.examId);

    if (!examData.showResults && attempt.status !== 'Graded') {
      return res.status(403).send("Results are not available for this exam");
    }

    const result = {
      examTitle: examData.title,
      totalMarks: examData.totalMarks,
      marksObtained: attempt.totalMarksObtained,
      percentage: attempt.percentage,
      correctAnswers: attempt.correctAnswers,
      wrongAnswers: attempt.wrongAnswers,
      unansweredQuestions: attempt.unansweredQuestions,
      isPassed: attempt.isPassed,
      totalTime: attempt.totalTime,
      startTime: attempt.startTime,
      endTime: attempt.endTime,
      answers: attempt.answers
    };

    res.send(result);
  }
  catch (err) {
    res.status(500).send("Error fetching result: " + err.message);
  }
});

// Get Student's Exam History (Student)
router.get('/exam-history', async (req, res) => {
  try {
    const attempts = await exam_attempt.find({ studentId: req.user._id }).populate('examId', 'title subject');

    const history = attempts.map(attempt => ({
      attemptId: attempt._id,
      examTitle: attempt.examId.title,
      subject: attempt.examId.subject,
      marksObtained: attempt.totalMarksObtained,
      percentage: attempt.percentage,
      isPassed: attempt.isPassed,
      status: attempt.status,
      startTime: attempt.startTime,
      endTime: attempt.endTime
    }));

    res.send(history);
  }
  catch (err) {
    res.status(500).send("Error fetching exam history: " + err.message);
  }
});

module.exports = router;
