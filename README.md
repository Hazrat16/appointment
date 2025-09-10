# Doctor Appointment Booking App

A full-stack application for booking doctor appointments with role-based authentication.

## Features

- **User Authentication**: JWT-based authentication with role management (Patient, Doctor, Admin)
- **Doctor Management**: Doctors can set their availability and manage appointments
- **Patient Booking**: Patients can view available slots and book appointments
- **Admin Dashboard**: Admin can manage users and view system statistics
- **Real-time Updates**: Live availability updates and appointment notifications

## Tech Stack

### Frontend

- Next.js 14 with TypeScript
- Tailwind CSS for styling
- React Hook Form for form handling
- Axios for API calls
- React Query for state management

### Backend

- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- CORS for cross-origin requests

## Project Structure

```
appointment/
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Custom middleware
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utility functions
│   │   └── app.js          # Express app setup
│   ├── package.json
│   └── .env.example
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js app router
│   │   ├── components/    # Reusable components
│   │   ├── lib/           # Utility functions
│   │   ├── types/         # TypeScript types
│   │   └── hooks/         # Custom hooks
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Backend Setup

1. Navigate to backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure variables
4. Start the server: `npm run dev`

### Frontend Setup

1. Navigate to frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

### Environment Variables

#### Backend (.env)

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/appointment-app
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
NODE_ENV=development
```

#### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Doctors

- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID
- `PUT /api/doctors/availability` - Update doctor availability

### Appointments

- `GET /api/appointments` - Get user appointments
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

## Getting Started

Follow the step-by-step implementation guide in the documentation to build the application incrementally.
# appointment
