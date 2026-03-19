const express = require('express');
const router = express.Router();
const exam = require("../models/exam");
const exam_attempt = require("../models/exam_attempt");

// Middleware - Authentication & Authorization (will be applied in server.js)

// Create Exam (Admin only)
router.post('/exam/create', async (req, res) => {
  try {
    const { title, subject, description, duration, totalQuestions, totalMarks, passingScore, difficulty, questions } = req.body;

    if (!title || !subject || !totalMarks || !passingScore || !questions) {
      return res.status(400).send("Missing required fields");
    }

    const newExam = await exam.create({
      title,
      subject,
      description,
      duration: duration || 60,
      totalQuestions: questions.length,
      totalMarks,
      passingScore,
      difficulty: difficulty || 'Medium',
      questions,
      createdBy: req.user._id,
      status: 'Draft'
    });

    res.status(201).send({ message: "Exam created successfully", exam: newExam });
  }
  catch (err) {
    res.status(500).send("Error creating exam: " + err.message);
  }
});

// Get All Exams Created by Admin
router.get('/exams', async (req, res) => {
  try {
    const adminExams = await exam.find({ createdBy: req.user._id }).select('-questions.correctAnswer');
    res.send(adminExams);
  }
  catch (err) {
    res.status(500).send("Error fetching exams: " + err.message);
  }
});

// Update Exam (Admin only)
router.put('/exam/:examId', async (req, res) => {
  try {
    const examId = req.params.examId;
    const examData = await exam.findById(examId);

    if (!examData) {
      return res.status(404).send("Exam not found");
    }

    if (examData.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).send("You can only update your own exams");
    }

    const updatedExam = await exam.findByIdAndUpdate(
      examId,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );

    res.send({ message: "Exam updated successfully", exam: updatedExam });
  }
  catch (err) {
    res.status(500).send("Error updating exam: " + err.message);
  }
});

// Publish/Unpublish Exam (Admin only)
router.put('/exam/:examId/publish', async (req, res) => {
  try {
    const examId = req.params.examId;
    const { isPublished, status } = req.body;

    const examData = await exam.findById(examId);

    if (!examData) {
      return res.status(404).send("Exam not found");
    }

    if (examData.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).send("You can only publish your own exams");
    }

    const updatedExam = await exam.findByIdAndUpdate(
      examId,
      { isPublished: isPublished !== undefined ? isPublished : true, status: status || 'Active', updatedAt: Date.now() },
      { new: true }
    );

    res.send({ message: "Exam published successfully", exam: updatedExam });
  }
  catch (err) {
    res.status(500).send("Error publishing exam: " + err.message);
  }
});

// Delete Exam (Admin only)
router.delete('/exam/:examId', async (req, res) => {
  try {
    const examId = req.params.examId;
    const examData = await exam.findById(examId);

    if (!examData) {
      return res.status(404).send("Exam not found");
    }

    if (examData.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).send("You can only delete your own exams");
    }

    await exam.findByIdAndDelete(examId);
    res.send({ message: "Exam deleted successfully" });
  }
  catch (err) {
    res.status(500).send("Error deleting exam: " + err.message);
  }
});

// Get All Student Attempts for an Exam (Admin only)
router.get('/exam/:examId/attempts', async (req, res) => {
  try {
    const examId = req.params.examId;
    const examData = await exam.findById(examId);

    if (!examData) {
      return res.status(404).send("Exam not found");
    }

    if (examData.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).send("You can only view attempts of your exams");
    }

    const attempts = await exam_attempt.find({ examId: examId }).populate('studentId', 'name email');
    res.send(attempts);
  }
  catch (err) {
    res.status(500).send("Error fetching attempts: " + err.message);
  }
});

module.exports = router;
