# Doctor Verification System Guide

## Overview

The doctor verification system ensures that only verified doctors appear in the public doctor list, providing quality control and trust for patients. This guide explains how the system works and how to use it.

## Problem Solved

Previously, when you registered a doctor with `doctor@yopmail.com`, it wasn't showing up in the doctor list because:

1. **Verification Filter**: The public doctor list API (`GET /api/doctors`) only shows doctors with `isVerified: true`
2. **Default Status**: New doctors are created with `isVerified: false`
3. **No Verification Process**: There was no way to verify doctors

## Solution Implemented

### 1. Enhanced Doctor Registration Response

When a doctor registers, the response now includes verification information:

```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "...",
  "user": { ... },
  "doctorProfile": {
    "id": "doctor_id",
    "specialization": "Cardiology",
    "isVerified": false,
    "verificationStatus": "pending",
    "message": "Your doctor profile is pending verification. It will be visible to patients once verified by an administrator."
  }
}
```

### 2. Admin Endpoints for Doctor Verification

#### Get All Doctors (Admin Only)

```
GET /api/doctors/admin/all
Authorization: Bearer <admin_token>
```

**Query Parameters:**

- `verificationStatus` (optional): Filter by verification status (`true`/`false`)
- `specialization` (optional): Filter by specialization
- `search` (optional): Search in specialization or bio
- `page` (optional): Page number for pagination
- `limit` (optional): Number of results per page

**Response:**

```json
{
  "success": true,
  "count": 5,
  "total": 10,
  "pagination": { ... },
  "doctors": [
    {
      "id": "doctor_id",
      "user": { ... },
      "specialization": "Cardiology",
      "isVerified": false,
      ...
    }
  ]
}
```

#### Verify/Unverify Doctor

```
PUT /api/doctors/admin/:id/verify
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "isVerified": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Doctor verified successfully",
  "doctor": { ... }
}
```

#### Get Verification Statistics

```
GET /api/doctors/admin/stats
Authorization: Bearer <admin_token>
```

**Response:**

```json
{
  "success": true,
  "stats": {
    "total": 10,
    "verified": 7,
    "unverified": 3,
    "verificationRate": 70
  },
  "recentUnverified": [ ... ]
}
```

## How to Use

### Step 1: Register a Doctor

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "doctor@yopmail.com",
    "password": "123456",
    "phone": "+1234567890",
    "dateOfBirth": "1980-01-01",
    "gender": "male",
    "role": "doctor",
    "specialization": "Cardiology",
    "licenseNumber": "DOC123456",
    "experience": 10,
    "education": [{
      "degree": "MD",
      "institution": "Medical School",
      "year": 2005
    }],
    "consultationFee": 100,
    "bio": "Experienced cardiologist",
    "languages": ["English"]
  }'
```

### Step 2: Create an Admin User

You need an admin user to verify doctors. Register with `role: "admin"`:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@yopmail.com",
    "password": "123456",
    "phone": "+1234567890",
    "dateOfBirth": "1980-01-01",
    "gender": "male",
    "role": "admin"
  }'
```

### Step 3: Login as Admin

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yopmail.com",
    "password": "123456"
  }'
```

### Step 4: Get All Doctors (Including Unverified)

```bash
curl -X GET http://localhost:5000/api/doctors/admin/all \
  -H "Authorization: Bearer <admin_token>"
```

### Step 5: Verify a Doctor

```bash
curl -X PUT http://localhost:5000/api/doctors/admin/<doctor_id>/verify \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"isVerified": true}'
```

### Step 6: Check Public Doctor List

```bash
curl -X GET http://localhost:5000/api/doctors
```

## Testing the System

### Run the Test Script

```bash
cd /media/hazrat/Hazrat1/Code/Node/appointment/backend
node test_api_endpoints.js
```

### Manual Testing Steps

1. **Start the server**:

   ```bash
   cd /media/hazrat/Hazrat1/Code/Node/appointment/backend
   npm start
   ```

2. **Register a doctor** using the API or frontend

3. **Check public doctor list** - should be empty (no verified doctors)

4. **Login as admin** and verify the doctor

5. **Check public doctor list again** - should now include the verified doctor

## Frontend Integration

The frontend should handle the verification status in doctor registration:

```typescript
interface DoctorRegistrationResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
  doctorProfile?: {
    id: string;
    specialization: string;
    isVerified: boolean;
    verificationStatus: "verified" | "pending";
    message: string;
  };
}
```

Show appropriate messages to users:

- **Verified**: "Your profile is verified and visible to patients"
- **Pending**: "Your profile is pending verification. It will be visible once verified by an administrator."

## Database Schema

The `Doctor` model includes:

```javascript
{
  isVerified: {
    type: Boolean,
    default: false
  }
}
```

## Security Notes

- Only users with `role: 'admin'` can access admin endpoints
- Admin endpoints require authentication via JWT token
- All admin actions are logged and can be audited

## Troubleshooting

### Doctor Not Showing in List

1. Check if doctor is verified: `GET /api/doctors/admin/all`
2. Verify the doctor: `PUT /api/doctors/admin/:id/verify`
3. Check public list again: `GET /api/doctors`

### Admin Access Issues

1. Ensure user has `role: 'admin'`
2. Check JWT token is valid
3. Verify token is included in Authorization header

### Registration Validation Errors

- Ensure all required doctor fields are provided
- Check education array has at least one entry
- Verify consultation fee and experience are non-negative numbers

### Route Ordering Issues

If you encounter `CastError: Cast to ObjectId failed for value "dashboard"` errors:

- This happens when specific routes (like `/dashboard`, `/admin/*`) are defined after generic `/:id` routes
- Ensure specific routes are defined before parameterized routes in your Express router
- Route order matters: `/dashboard` should come before `/:id`
