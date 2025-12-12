# 🔐 User Management API – Implementation Report

This document explains everything that is implemented and fixed in the User Management API assessment.

---

## Video

[Video Recording](https://drive.google.com/file/d/1M1wqN3BlDm75VKi1AxLvR1WZ1IZVGzca/view?usp=sharing)

## ✅ Overview

This project contained intentional bugs, security vulnerabilities, and hidden puzzles. All required fixes, improvements, and puzzles have been completed.

---

## 🛠️ Fixes Implemented

### 🔐 Security Fixes

#### ✔ Removed Hardcoded JWT Secret
Replaced all hardcoded values with environment variable:
```env
JWT_SECRET=your_secret_here
```

#### ✔ Removed Password Exposure
Passwords are now fully removed from all API responses, including:
- User lists
- User details
- Updates
- Secret endpoints

#### ✔ Added Missing Authentication
All protected routes now require a valid JWT token.

#### ✔ Added Input Validation
Validation added for:
- Email format
- Password strength

#### ✔ Fixed bcrypt Async Bug
`bcrypt.compare` is now properly awaited to prevent faulty login logic.

#### ✔ Implemented Role-Based Access Control
Only admins can:
- Delete users
- Access admin stats
- Modify roles

#### ✔ Prevented Self-Deletion
Admin users can no longer delete their own accounts.

---

### ⚙️ Functional Fixes

#### ✔ Centralized User Data Store
Replaced duplicated user arrays with a single shared data module. Also, kept jwt token verification and role checking in a centralised way.

#### ✔ Improved Error Handling
Added:
- Consistent error structure
- Try/catch blocks
- Safe JSON parsing

#### ✔ Added Pagination
Implemented on GET `/api/users`:
```
/api/users?page=1&limit=10
```

#### ✔ Password Hashing on Updates
When updating passwords, values are always re-hashed.

---

## 🚀 Features Implemented

### ✔ JWT Authentication Middleware
A reusable middleware now validates and decodes tokens.

### ✔ User Profile Endpoint
```
GET /api/auth/profile
```

### ✔ Password Change Endpoint
```
POST /api/auth/change-password
```

### ✔ Admin Statistics Endpoint
```
GET /api/admin/stats
```

### ✔ Improved Update Permissions
Rules enforced:
- Users can update only themselves
- Admins can update anyone
- Only admins can change roles

### ✔ Improved Delete Logic
- Only admins can delete
- Admins cannot delete themselves

### ✔ XSS 
- Used helmet
- XSS-clean

###  ✔ Rate limiting
- Number of users in one page
- Along with the total pages

---

## 🧩 Puzzle Solutions

### 🎯 Puzzle 1: Secret Header
```
X-Secret-Challenge: find_me_if_you_can_2024
```

### 🎯 Puzzle 2: Hidden Endpoint
```
/api/users/secret-stats/
```

### 🎯 Puzzle 3: Encoded Message
Decoded secret message obtained from the hidden endpoint.

### 🎯 Puzzle 4: Access Methods
The secret endpoint can be accessed by 2 giving headers and query params:

**Method 1 — Secret Header**
```
x-secret-challenge: find_me_if_you_can_2024
```

**Method 2 — Query Parameter**
```
/api/users/secret-stats?secret=admin_override
```

---

## 🔧 Testing Performed

Manual tests included:
- Login
- Registration
- Profile retrieval
- Update operations
- Role enforcement
- Password hashing
- Token validation
- Pagination
- Admin-only endpoints
- Secret endpoint access

All features behaved as expected after fixes.

---

## 📌 Final Result

- ✔ All bugs fixed
- ✔ All required features implemented
- ✔ All puzzles solved
- ✔ Security significantly improved
- ✔ Code cleaned and modernized

---

## How to run 

- Fork the repository
- Clone it 
- npm i
- npm run dev


## 👤 Author

**Sahanashre V**
- GitHub: [Sahanashre](https://github.com/Sahanashre-V)

---
