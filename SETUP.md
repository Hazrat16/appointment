# Doctor Appointment Booking App - Setup Guide

This guide will help you set up and run the complete doctor appointment booking application.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (local installation or MongoDB Atlas account) - [Download here](https://www.mongodb.com/try/download/community)
- **Git** - [Download here](https://git-scm.com/)

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
│   └── env.example
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

## Step-by-Step Setup

### 1. Clone and Navigate to Project

```bash
cd /media/hazrat/Hazrat1/Code/Node/appointment
```

### 2. Backend Setup

#### 2.1 Install Dependencies

```bash
cd backend
npm install
```

#### 2.2 Environment Configuration

```bash
# Copy the environment example file
cp env.example .env

# Edit the .env file with your configuration
nano .env
```

**Required Environment Variables:**

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/appointment-app

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

#### 2.3 Start MongoDB

**Option A: Local MongoDB**

```bash
# Start MongoDB service (Linux/Mac)
sudo systemctl start mongod

# Or start manually
mongod --dbpath /path/to/your/db
```

**Option B: MongoDB Atlas (Cloud)**

- Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
- Create a new cluster
- Get your connection string and update `MONGODB_URI` in `.env`

#### 2.4 Start Backend Server

```bash
# Development mode with auto-restart
npm run dev

# Or production mode
npm start
```

The backend will be running at `http://localhost:5000`

### 3. Frontend Setup

#### 3.1 Install Dependencies

```bash
cd ../frontend
npm install
```

#### 3.2 Environment Configuration

```bash
# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
```

#### 3.3 Start Frontend Server

```bash
# Development mode
npm run dev

# Or build and start production
npm run build
npm start
```

The frontend will be running at `http://localhost:3000`

## 4. Initial Setup

### 4.1 Create Admin User

You can create an admin user by registering through the frontend or by using the API directly:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@example.com",
    "password": "password123",
    "phone": "+1234567890",
    "dateOfBirth": "1990-01-01",
    "gender": "male",
    "role": "admin"
  }'
```

### 4.2 Create Doctor User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Smith",
    "email": "doctor@example.com",
    "password": "password123",
    "phone": "+1234567890",
    "dateOfBirth": "1980-01-01",
    "gender": "male",
    "role": "doctor",
    "specialization": "Cardiology",
    "licenseNumber": "DOC123456",
    "experience": 10,
    "consultationFee": 150,
    "bio": "Experienced cardiologist with 10 years of practice.",
    "languages": "English, Spanish"
  }'
```

### 4.3 Create Patient User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "patient@example.com",
    "password": "password123",
    "phone": "+1234567890",
    "dateOfBirth": "1995-01-01",
    "gender": "female",
    "role": "patient"
  }'
```

## 5. Usage Guide

### 5.1 Access the Application

1. Open your browser and go to `http://localhost:3000`
2. You'll be redirected to the login page
3. Use the credentials you created above to log in

### 5.2 User Roles and Features

#### Patient Role:

- **Dashboard**: View upcoming and past appointments
- **Find Doctors**: Search and filter doctors by specialization
- **Book Appointments**: Select available time slots
- **Manage Appointments**: View, reschedule, or cancel appointments

#### Doctor Role:

- **Dashboard**: View today's appointments and statistics
- **Manage Availability**: Set weekly availability schedule
- **View Appointments**: See all patient appointments
- **Update Profile**: Manage professional information

#### Admin Role:

- **User Management**: View and manage all users
- **System Statistics**: Monitor platform usage
- **Appointment Management**: Oversee all appointments

### 5.3 Key Features

1. **Authentication**: JWT-based secure authentication
2. **Role-based Access**: Different dashboards for different user types
3. **Real-time Availability**: Dynamic time slot generation
4. **Appointment Management**: Full CRUD operations for appointments
5. **Responsive Design**: Works on desktop and mobile devices
6. **Form Validation**: Client and server-side validation
7. **Error Handling**: Comprehensive error handling and user feedback

## 6. API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Doctors

- `GET /api/doctors` - Get all doctors (with pagination and filters)
- `GET /api/doctors/:id` - Get single doctor
- `GET /api/doctors/:id/availability` - Get doctor availability for date
- `PUT /api/doctors/availability` - Update doctor availability (doctor only)
- `GET /api/doctors/dashboard` - Get doctor dashboard data

### Appointments

- `GET /api/appointments` - Get user appointments
- `GET /api/appointments/:id` - Get single appointment
- `POST /api/appointments` - Create new appointment (patient only)
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

## 7. Development

### 7.1 Backend Development

```bash
cd backend
npm run dev  # Starts with nodemon for auto-restart
```

### 7.2 Frontend Development

```bash
cd frontend
npm run dev  # Starts Next.js development server
```

### 7.3 Database Management

The application uses MongoDB with Mongoose ODM. Models are defined in `backend/src/models/`:

- **User**: User accounts and authentication
- **Doctor**: Doctor profiles and professional information
- **Availability**: Doctor availability schedules
- **Appointment**: Appointment bookings and management

## 8. Production Deployment

### 8.1 Backend Deployment

1. Set `NODE_ENV=production` in your environment
2. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start src/app.js --name "appointment-backend"
   ```

### 8.2 Frontend Deployment

1. Build the application:

   ```bash
   npm run build
   ```

2. Deploy to platforms like Vercel, Netlify, or your own server

### 8.3 Environment Variables for Production

Make sure to set secure values for:

- `JWT_SECRET`: Use a strong, random secret
- `MONGODB_URI`: Use your production database URL
- `FRONTEND_URL`: Set to your production frontend URL

## 9. Troubleshooting

### Common Issues:

1. **MongoDB Connection Error**: Ensure MongoDB is running and the connection string is correct
2. **CORS Errors**: Check that `FRONTEND_URL` matches your frontend URL
3. **JWT Errors**: Verify `JWT_SECRET` is set and consistent
4. **Port Conflicts**: Change ports in environment variables if needed

### Logs:

- Backend logs: Check console output or PM2 logs
- Frontend logs: Check browser console and Next.js terminal output

## 10. Support

If you encounter any issues:

1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check that MongoDB is running and accessible

## 11. Next Steps

After successful setup, you can:

1. Customize the UI design and branding
2. Add more features like notifications, payments, etc.
3. Implement additional user roles
4. Add more appointment types and services
5. Integrate with external services (email, SMS, etc.)

Happy coding! 🚀
