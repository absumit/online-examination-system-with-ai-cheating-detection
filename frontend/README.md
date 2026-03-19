# Exam System Frontend

A modern React frontend for an online examination system built with React, React Router, Tailwind CSS, and Axios.

## Features

- **User Authentication**: Login and registration for students and admins
- **Admin Dashboard**: Create, publish, and manage exams
- **Student Dashboard**: Browse available exams and view exam history
- **Exam Interface**: Take exams with timer, answer review, and auto-save
- **Results & Analytics**: View detailed results with answer review
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   └── CreateExamModal.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── StudentDashboard.jsx
│   │   ├── ExamPage.jsx
│   │   ├── ResultsPage.jsx
│   │   └── NotFound.jsx
│   ├── context/
│   │   └── AuthContext.js
│   ├── utils/
│   │   └── api.js
│   ├── index.css
│   ├── index.js
│   └── App.jsx
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── .gitignore
```

## Installation

1. Navigate to the frontend folder:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file (optional, API URL defaults to http://localhost:8080):

```
REACT_APP_API_URL=http://localhost:8080
```

## Running the Application

Start the development server:

```bash
npm start
```

The application will open at `http://localhost:3000`

## Build for Production

```bash
npm run build
```

## Technologies Used

- **React 18.2** - Frontend framework
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API calls
- **React Scripts** - Build and development tools

## API Integration

The frontend communicates with the backend API at `http://localhost:8080` with the following endpoints:

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/logout` - Logout user

### Admin APIs

- `POST /admin/exam/create` - Create exam
- `GET /admin/exams` - Get all admin exams
- `PUT /admin/exam/:examId` - Update exam
- `PUT /admin/exam/:examId/publish` - Publish exam
- `DELETE /admin/exam/:examId` - Delete exam
- `GET /admin/exam/:examId/attempts` - Get attempts

### Student APIs

- `GET /student/exams` - Get published exams
- `GET /student/exam/:examId` - Get exam details
- `POST /student/exam/:examId/start` - Start exam
- `PUT /student/exam/attempt/:attemptId/answer` - Submit answer
- `POST /student/exam/attempt/:attemptId/submit` - Submit exam
- `GET /student/exam/attempt/:attemptId/result` - Get results
- `GET /student/exam-history` - Get exam history

## User Roles

### Student

- Can view published exams
- Can take exams with auto-save functionality
- Can view exam results and history

### Admin

- Can create and manage exams
- Can publish/unpublish exams
- Can view all student attempts

## Features

✅ Responsive design for all devices
✅ Real-time timer during exams
✅ Auto-save answers while taking exam
✅ Question navigation
✅ Detailed results with answer review
✅ Exam history tracking
✅ Role-based access control
✅ Modern UI with Tailwind CSS

## Notes

- Ensure the backend server is running on `http://localhost:8080`
- Cookies are used for authentication tokens
- All sensitive operations require authentication
