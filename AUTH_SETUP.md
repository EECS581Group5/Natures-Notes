# Authentication Setup Guide

This guide explains how to use the JWT-based authentication system in Natures Notes.

## Overview

The authentication system includes:
- User registration with email validation and password strength requirements
- Login with JWT token generation
- Protected API routes that require authentication
- User-specific data isolation (users can only access their own notes)

## Database Setup

1. Run the SQL commands in `backend/init-db.sql` in your Neon PostgreSQL database console:
   - Creates `users` table with email, password_hash, and username
   - Creates `notes` table with user_id foreign key
   - Sets up proper indexes for performance

## Environment Variables

Add these to your Vercel environment variables:

```
DATABASE_URL=postgresql://neondb_owner:npg_2KqrPCek7DJl@ep-floral-salad-aeok6d2y-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your_strong_random_secret_key_here
```

**Important**: Generate a strong random JWT_SECRET for production. You can use:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## API Endpoints

### Public Endpoints (No Authentication Required)

#### Register a New User
```
POST /api/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "username": "JohnDoe"
}

Response:
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "JohnDoe",
    "createdAt": "2025-01-15T12:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Password Requirements:**
- At least 8 characters long
- Must contain at least one uppercase letter
- Must contain at least one lowercase letter
- Must contain at least one number

#### Login
```
POST /api/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}

Response:
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "JohnDoe",
    "createdAt": "2025-01-15T12:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Protected Endpoints (Authentication Required)

All protected endpoints require the JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Get All Notes for Current User
```
GET /api/notes
Authorization: Bearer <token>

Response:
[
  {
    "id": 1,
    "user_id": 1,
    "title": "My First Note",
    "content": "Note content here",
    "created_at": "2025-01-15T12:00:00.000Z",
    "updated_at": "2025-01-15T12:00:00.000Z"
  }
]
```

#### Create a New Note
```
POST /api/notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My Note Title",
  "content": "Note content here"
}

Response:
{
  "id": 1,
  "user_id": 1,
  "title": "My Note Title",
  "content": "Note content here",
  "created_at": "2025-01-15T12:00:00.000Z",
  "updated_at": "2025-01-15T12:00:00.000Z"
}
```

#### Update a Note
```
PUT /api/notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": 1,
  "title": "Updated Title",
  "content": "Updated content"
}

Response:
{
  "id": 1,
  "user_id": 1,
  "title": "Updated Title",
  "content": "Updated content",
  "created_at": "2025-01-15T12:00:00.000Z",
  "updated_at": "2025-01-15T13:00:00.000Z"
}
```

#### Delete a Note
```
DELETE /api/notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": 1
}

Response:
{
  "message": "Note deleted successfully",
  "note": {
    "id": 1,
    "user_id": 1,
    "title": "Deleted Note",
    "content": "Content",
    "created_at": "2025-01-15T12:00:00.000Z",
    "updated_at": "2025-01-15T12:00:00.000Z"
  }
}
```

## Frontend Integration Example

### Store the token after login/register:
```javascript
// After successful login or registration
const response = await fetch('/api/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ email, password })
});

const data = await response.json();

// Store token in localStorage
localStorage.setItem('authToken', data.token);

// Store user data if needed
localStorage.setItem('user', JSON.stringify(data.user));
```

### Use the token for authenticated requests:
```javascript
const token = localStorage.getItem('authToken');

const response = await fetch('/api/notes', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const notes = await response.json();
```

### Handle token expiration:
```javascript
const response = await fetch('/api/notes', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

if (response.status === 401) {
  // Token expired or invalid
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  // Redirect to login page
  window.location.href = '/login';
}
```

## Security Features

1. **Password Hashing**: Passwords are hashed using bcrypt with 10 salt rounds
2. **JWT Expiration**: Tokens expire after 7 days
3. **Email Validation**: Email format is validated before registration
4. **Password Strength**: Enforces strong password requirements
5. **User Isolation**: Users can only access their own data
6. **SQL Injection Protection**: Uses parameterized queries

## Testing with cURL

### Register:
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123","username":"TestUser"}'
```

### Login:
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123"}'
```

### Get Notes (replace TOKEN with actual token):
```bash
curl -X GET http://localhost:3000/api/notes \
  -H "Authorization: Bearer TOKEN"
```

### Create Note:
```bash
curl -X POST http://localhost:3000/api/notes \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Note","content":"Note content"}'
```

## Troubleshooting

### "Invalid or expired token"
- Token may have expired (7 day limit)
- Token format is incorrect (should be "Bearer <token>")
- JWT_SECRET environment variable doesn't match

### "User with this email already exists"
- Try logging in instead of registering
- Use a different email address

### "Invalid email or password"
- Check email spelling
- Verify password is correct
- Ensure email is lowercase

### Database connection errors
- Verify DATABASE_URL is correct in Vercel environment variables
- Check that database tables have been created (run init-db.sql)
