# 🔐 Assessment 1: User Management API

Welcome to the User Management API assessment! This project contains a Node.js API with intentional bugs and missing features that you need to fix and implement.

## 🎯 Objective

Your goal is to:
1. **Fix all bugs** in the existing code
2. **Implement missing features** 
3. **Solve the puzzles** hidden throughout the application
4. **Improve security** and best practices

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Netlify CLI (for local development)

### Installation

```bash
npm install
npm run dev
```

The API will be available at `http://localhost:8888`

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/auth/login
Login with email and password
```json
{
  "email": "admin@test.com",
  "password": "admin123"
}
```

#### POST /api/auth/register  
Register a new user
```json
{
  "email": "newuser@test.com",
  "password": "securepassword123",
  "name": "New User"
}
```

### User Management Endpoints

#### GET /api/users
Get all users (requires authentication)

#### GET /api/users/:id
Get user by ID (requires authentication)

#### PUT /api/users/:id
Update user information (requires authentication)

#### DELETE /api/users/:id
Delete user (requires admin role)

## 🐛 Bugs to Fix

### Critical Security Issues
1. **Hardcoded JWT Secret** - The JWT secret is hardcoded in multiple files
2. **Password Exposure** - User passwords are being returned in API responses
3. **Missing Authentication** - Many endpoints lack proper authentication
4. **No Input Validation** - Missing validation for email format, password strength
5. **Async/Await Bug** - bcrypt.compare is not being awaited properly
6. **No Rate Limiting** - API endpoints are vulnerable to brute force attacks

### Functionality Bugs
7. **Duplicate User Data** - User array is duplicated across files instead of being centralized
8. **Missing Error Handling** - Inadequate error handling for JSON parsing and other operations
9. **No Role-Based Access** - Admin-only operations aren't properly protected
10. **Self-Deletion Prevention** - Users can delete their own accounts without restrictions

## ⚡ Features to Implement

### Must-Have Features
1. **JWT Authentication Middleware** - Create proper auth middleware for protected routes
2. **Input Validation** - Implement comprehensive validation for all inputs
3. **Password Hashing for Updates** - Ensure password updates are properly hashed
4. **User Profile Endpoint** - Add GET /api/auth/profile to get current user info
5. **Password Change Endpoint** - Add POST /api/auth/change-password
6. **Admin User Statistics** - Add GET /api/admin/stats (admin only)

### Nice-to-Have Features  
7. **Pagination** - Add pagination to GET /api/users
8. **User Search** - Add search functionality to find users
9. **Account Activation** - Email-based account activation flow
10. **Password Reset** - Password reset functionality with secure tokens

## 🧩 Puzzles & Hidden Challenges

### Puzzle 1: Secret Headers
Find the secret header set in the network configuration. What value is it set to?

### Puzzle 2: Hidden Endpoint
There's a secret endpoint mentioned in the API responses. Can you find and access it?

### Puzzle 3: Encoded Message
Once you find the secret endpoint, decode the hidden message. What does it say?

### Puzzle 4: Access Methods
The secret endpoint has multiple ways to access it. Can you find both methods?

## 🔧 Testing Your Solutions

### Manual Testing Commands

```bash
# Test login
curl -X POST http://localhost:8888/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'

# Test user creation
curl -X POST http://localhost:8888/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123","name":"Test User"}'

# Test getting users (should require auth)
curl http://localhost:8888/api/users

# Test the secret endpoint (find the right way to access it!)
curl http://localhost:8888/api/users/secret-stats
```

### Expected Behavior After Fixes

1. **Secure Authentication** - JWT tokens should be properly validated
2. **No Sensitive Data Leaks** - Passwords should never be returned
3. **Proper Validation** - Invalid emails/weak passwords should be rejected
4. **Role-Based Security** - Only admins can access admin endpoints
5. **Centralized Data** - Single source of truth for user data

## 📝 Submission Guidelines

### What to Submit

1. **Fixed Code** - All bugs resolved and features implemented
2. **Documentation** - Update this README with any new endpoints or changes
3. **Test Report** - Document how you tested your solutions
4. **Puzzle Solutions** - List all the puzzles you solved and their answers

### Code Quality Requirements

- **ES6+ Features** - Use modern JavaScript features
- **Error Handling** - Comprehensive error handling throughout
- **Security Best Practices** - Implement proper security measures
- **Clean Code** - Well-commented, readable code
- **No Console Logs** - Remove all debug console.log statements

## 🎉 Bonus Points

- **Input Sanitization** - Prevent XSS and injection attacks
- **API Documentation** - Generate Swagger/OpenAPI documentation  
- **Unit Tests** - Write tests for your functions
- **Environment Variables** - Use proper environment configuration
- **Logging System** - Implement proper application logging

## 🚨 Common Pitfalls

1. Don't just comment out bugs - fix them properly
2. Ensure your authentication middleware works with all protected routes
3. Remember to hash passwords when updating user profiles
4. Test edge cases (empty inputs, invalid tokens, etc.)
5. Make sure the secret endpoint puzzles still work after your fixes

## 📞 Support

If you get stuck on any puzzle or need clarification on requirements, document your questions and the approaches you tried. This shows your problem-solving process.

Good luck! 🍀
