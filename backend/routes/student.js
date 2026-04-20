const express = require('express');
const router = express.Router();
const exam = require("../models/exam");
const exam_attempt = require("../models/exam_attempt");




router.get('/exams', async (req, res) => {
  try {
    const publishedExams = await exam.find({ isPublished: true, status: 'Active' }).select('-questions').sort({ createdAt: -1 });
    
    // Check which exams the student has appeared in
    const examsWithAppearanceStatus = await Promise.all(
      publishedExams.map(async (examDoc) => {
        const examData = examDoc.toObject();
        const hasAppeared = await exam_attempt.countDocuments({
          examId: examDoc._id,
          studentId: req.user._id
        }) > 0;
        return {
          ...examData,
          hasAppeared
        };
      })
    );
    
    res.send(examsWithAppearanceStatus);
  }
  catch (err) {
    res.status(500).send("Error fetching exams: " + err.message);
  }
});


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

    // Check if exam is scheduled and within time window
    if (examData.scheduleStartTime || examData.scheduleEndTime) {
      const now = new Date();
      if (examData.scheduleStartTime && now < new Date(examData.scheduleStartTime)) {
        return res.status(403).send("This exam is not yet available. It will be available on " + new Date(examData.scheduleStartTime).toLocaleString());
      }
      if (examData.scheduleEndTime && now > new Date(examData.scheduleEndTime)) {
        return res.status(403).send("This exam has expired. The exam window ended on " + new Date(examData.scheduleEndTime).toLocaleString());
      }
    }
  
    const attemptCount = await exam_attempt.countDocuments({ examId, studentId: req.user._id });
    if (attemptCount >= examData.maxAttempts) {
      return res.status(403).send("You have exhausted your attempt limit for this exam");
    }

    const safeExam = {
      ...examData.toObject(),
      questions: examData.questions.map(q => ({
        _id: q._id,
        questionText: q.questionText,
        options: q.options,
        marks: q.marks,
        multipleAnswersAllowed: q.correctAnswers && q.correctAnswers.length > 1 // Indicates if multiple answers are accepted
        // Do NOT send correctAnswer or correctAnswers - students shouldn't see the answers!
      }))
    };

    res.send(safeExam);
  }
  catch (err) {
    res.status(500).send("Error fetching exam: " + err.message);
  }
});

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

   
    const attemptCount = await exam_attempt.countDocuments({ examId, studentId: req.user._id });
    if (attemptCount >= examData.maxAttempts) {
      return res.status(403).send("You have exhausted your attempt limit for this exam");
    }

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
        selectedAnswer: [], // Initialize as empty array
        correctAnswer: q.correctAnswer,
        correctAnswers: q.correctAnswers, // Include multiple answers if available
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

    // Validate inputs - allow non-empty strings or non-empty arrays
    const isValidAnswer = 
      (typeof selectedAnswer === 'string' && selectedAnswer.trim().length > 0) ||
      (Array.isArray(selectedAnswer) && selectedAnswer.length > 0);

    if (questionIndex === undefined || questionIndex === null || !isValidAnswer) {
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
      // Check if answer was selected (selectedAnswer is array with at least one element)
      if (!answer.selectedAnswer || answer.selectedAnswer.length === 0) {
        unansweredCount++;
      } else {
        // Check if answer is correct (handle both single and multiple correct answers)
        let isAnswerCorrect = false;
        
        const selectedAnswers = Array.isArray(answer.selectedAnswer) ? answer.selectedAnswer : [answer.selectedAnswer];
        
        if (answer.correctAnswers && Array.isArray(answer.correctAnswers) && answer.correctAnswers.length > 1) {
          // Multiple correct answers - check if selected answers match exactly
          const selectedSet = new Set(selectedAnswers);
          const correctSet = new Set(answer.correctAnswers);
          isAnswerCorrect = selectedSet.size === correctSet.size && 
                           Array.from(selectedSet).every(ans => correctSet.has(ans));
        } else if (answer.correctAnswers && Array.isArray(answer.correctAnswers) && answer.correctAnswers.length === 1) {
          // Single correct answer stored as array
          isAnswerCorrect = selectedAnswers.length === 1 && selectedAnswers[0] === answer.correctAnswers[0];
        } else if (answer.correctAnswer) {
          // Fallback to correctAnswer if correctAnswers not available
          isAnswerCorrect = selectedAnswers.length === 1 && selectedAnswers[0] === answer.correctAnswer;
        }
        
        if (isAnswerCorrect) {
          correctCount++;
          totalMarksObtained += answer.marks || 0;
          answer.isCorrect = true;
          answer.marksObtained = answer.marks || 0;
        } else {
          wrongCount++;
          answer.isCorrect = false;
          // Apply negative marking if enabled
          if (examData.negativeMarking && examData.negativeMarkingPerQuestion > 0) {
            answer.marksObtained = -(examData.negativeMarkingPerQuestion);
            totalMarksObtained -= examData.negativeMarkingPerQuestion;
          } else {
            answer.marksObtained = 0;
          }
        }
      }
    });

    // Ensure marks don't go below 0
    totalMarksObtained = Math.max(0, totalMarksObtained);

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

// Flag Tab Switch (Student)
router.post('/exam/attempt/:attemptId/flag-tab-switch', async (req, res) => {
  try {
    const attemptId = req.params.attemptId;
    const threshold = parseInt(process.env.TAB_SWITCH_THRESHOLD) || 3;

    const attempt = await exam_attempt.findByIdAndUpdate(
      attemptId,
      { $inc: { tabSwitches: 1 } },
      { new: true }
    );

    if (!attempt) {
      return res.status(404).send("Attempt not found");
    }

    // If threshold exceeded, mark suspicious and auto-submit exam
    if (attempt.tabSwitches > threshold && !attempt.isFlaggedSuspicious) {
      attempt.isFlaggedSuspicious = true;

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
          // Apply negative marking if enabled
          if (examData.negativeMarking && examData.negativeMarkingPerQuestion > 0) {
            answer.marksObtained = -(examData.negativeMarkingPerQuestion);
            totalMarksObtained -= examData.negativeMarkingPerQuestion;
          } else {
            answer.marksObtained = 0;
          }
        }
      });

      // Ensure marks don't go below 0
      totalMarksObtained = Math.max(0, totalMarksObtained);

      const percentage = (totalMarksObtained / examData.totalMarks) * 100;
      const isPassed = totalMarksObtained >= examData.passingScore;

      // Auto-submit exam
      attempt.endTime = new Date();
      attempt.totalMarksObtained = totalMarksObtained;
      attempt.correctAnswers = correctCount;
      attempt.wrongAnswers = wrongCount;
      attempt.unansweredQuestions = unansweredCount;
      attempt.percentage = percentage.toFixed(2);
      attempt.isPassed = isPassed;
      attempt.status = 'Graded';
      attempt.totalTime = Math.floor((attempt.endTime - attempt.startTime) / 1000);

      await attempt.save();

      return res.send({ 
        autoSubmitted: true, 
        message: 'Suspicious activity detected. Exam auto-submitted.',
        tabSwitches: attempt.tabSwitches 
      });
    }

    res.send({ success: true, tabSwitches: attempt.tabSwitches });
  }
  catch (err) {
    res.status(500).send("Error flagging tab switch: " + err.message);
  }
});

// Get Student's Exam History (Student)
router.get('/exam-history', async (req, res) => {
  try {
    const attempts = await exam_attempt.find({ studentId: req.user._id }).populate('examId', 'title subject');

    const history = attempts
      .filter(attempt => attempt.examId) // Filter out attempts where exam was deleted
      .map(attempt => ({
        attemptId: attempt._id,
        examTitle: attempt.examId?.title || 'Deleted Exam',
        subject: attempt.examId?.subject || 'N/A',
        marksObtained: attempt.totalMarksObtained || 0,
        percentage: attempt.percentage || 0,
        isPassed: attempt.isPassed || false,
        status: attempt.status || 'Unknown',
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
