# Exam Management System

A full-stack exam management platform with separate admin and student workflows.

## Project Structure

- `backend/` - Node.js, Express, MongoDB API
- `frontend/` - React app for admin and student dashboards
- `pdfreader/` - PDF/DOCX question extraction utilities

## Features

- Admin can create, publish, and manage exams
- Import questions from PDF or DOCX files
- Support for single-answer and multiple-correct-answer questions
- Student dashboard with exam availability and appearance status
- Exam taking flow with live answer saving
- Result review after submission
- Admin view of student attempts with sorting and filtering
- PDF export of student attempt results

## Backend

The backend contains:

- Authentication and role-based access
- Exam and attempt management
- MongoDB models for users, exams, and attempts
- Routes for admin and student actions

## Frontend

The frontend contains:

- Login and registration pages
- Admin dashboard
- Student dashboard
- Exam page
- Results page

## PDF Reader

The `pdfreader/reader.py` script can extract:

- Text from PDF files
- Text from DOCX files
- Questions and options
- Answer lines for imported questions

## Setup

### Backend

```bash
cd backend
npm install
node server.js
```

### Frontend

```bash
cd frontend
npm install
npm start
```

### PDF Reader

```bash
cd pdfreader
python reader.py aptitude.pdf --json-output output.json
```

## Notes

- Make sure MongoDB is running
- Configure environment variables if your backend requires them
- Use the admin dashboard to import questions and manage exams
