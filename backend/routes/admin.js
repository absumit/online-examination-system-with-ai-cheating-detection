const express = require('express');
const router = express.Router();
const exam = require("../models/exam");
const exam_attempt = require("../models/exam_attempt");
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');
const os = require('os');
const { spawn } = require('child_process');

const uploadDir = path.resolve(__dirname, '../uploads');
if (!fsSync.existsSync(uploadDir)) {
  fsSync.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx'];
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error('Only PDF and DOCX files are supported'));
    }
    cb(null, true);
  }
});

const runQuestionParser = (inputFilePath, outputFilePath) => {
  return new Promise((resolve, reject) => {
    const pythonExecutable = process.env.PYTHON_PATH || 'python';
    const parserScriptPath = path.resolve(__dirname, '../../pdfreader/reader.py');
    const args = [parserScriptPath, inputFilePath, '--json-output', outputFilePath];
    const child = spawn(pythonExecutable, args, { cwd: path.resolve(__dirname, '../../pdfreader') });

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to start parser: ${err.message}`));
    });

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(stderr || `Parser exited with code ${code}`));
      }
      resolve();
    });
  });
};

const normalizeImportedQuestions = (parsedQuestions) => {
  if (!Array.isArray(parsedQuestions)) {
    return [];
  }

  return parsedQuestions
    .map((item) => {
      const rawQuestion = String(item.question || item.questionText || '').trim();
      const rawOptions = item.options;
      let options = [];

      if (Array.isArray(rawOptions)) {
        options = rawOptions;
      } else if (rawOptions && typeof rawOptions === 'object') {
        options = Object.values(rawOptions);
      }

      const normalizedOptions = options
        .map((opt) => String(opt || '').trim())
        .filter(Boolean);

      return {
        questionText: rawQuestion,
        options: normalizedOptions,
        correctAnswer: ''
      };
    })
    .filter((q) => q.questionText && q.options.length >= 2);
};

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

// Import Questions from PDF/DOCX using python parser (Admin only)
router.post('/exam/questions/import', (req, res) => {
  upload.single('file')(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ message: uploadErr.message || 'Invalid upload request' });
    }

    const uploadedFilePath = req.file?.path;
    const outputJsonPath = path.join(os.tmpdir(), `questions-${Date.now()}-${Math.round(Math.random() * 1e9)}.json`);

    if (!uploadedFilePath) {
      return res.status(400).json({ message: 'Please upload a PDF or DOCX file' });
    }

    try {
      await runQuestionParser(uploadedFilePath, outputJsonPath);

      const jsonContent = await fs.readFile(outputJsonPath, 'utf-8');
      const parsedQuestions = JSON.parse(jsonContent);
      const questions = normalizeImportedQuestions(parsedQuestions);

      if (!questions.length) {
        return res.status(400).json({
          message: 'No valid questions were found in the uploaded file'
        });
      }

      return res.json({
        message: 'Questions imported successfully',
        count: questions.length,
        questions
      });
    } catch (err) {
      return res.status(500).json({
        message: `Failed to import questions: ${err.message}`
      });
    } finally {
      if (uploadedFilePath) {
        await fs.unlink(uploadedFilePath).catch(() => {});
      }
      await fs.unlink(outputJsonPath).catch(() => {});
    }
  });
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
