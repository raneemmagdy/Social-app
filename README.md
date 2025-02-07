# Social Media App

Welcome to the **Social Media App**! 🚀 This is a backend project built using **Node.js**, **Express.js**, and **MongoDB** to provide a robust and secure API for user authentication, profile management, friend requests, and two-step verification.


## 🚀 Live Demo
Check out the live version of the app:
🔗 [Social Media App](https://social-media-app-iota-sable.vercel.app/)

## 📌 API Documentation
Explore the full API documentation on Postman:
🔗 [Postman Documentation](https://documenter.getpostman.com/view/26311189/2sAYQdjpve)

## 🛠️ Tech Stack
- **Backend:** Node.js, Express.js, MongoDB
- **Authentication:** JWT (JSON Web Tokens), Two-Step Verification
- **Storage:** Cloudinary (for media uploads)
- **Security:** Rate Limiting, Input Validation, Role-Based Access Control
- **Deployment:** Vercel, MongoDB Atlas

## 🔑 Features
- **User Authentication:** Email & Password Or Phone & Password, Google Sign-In, Two-Step Verification
- **Profile Management:** Update profile picture, cover images, email, and password & update Password & share Profile & updateEmail
- **Friend Requests:** Send, accept, and reject friend requests
- **Posts & Comments:** Create, update, and delete posts & comments with media support
- **Roles & Permissions:** User and [Admin and Super Admin dashboards]
- **Secure API:** Rate limiting, role-based access control, validation


## ⚙️ Installation & Setup
### 1️⃣ Clone the Repository
```bash
git clone https://github.com/raneemmagdy/Social-app.git
cd Social-app
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Set Up Environment Variables
Create a `.env` file and configure the following variables:
```
PORT=3000
MONGO_DB_URI=your_mongodb_connection_string
PREFIX_FOR_USER=Bearer
PREFIX_FOR_ADMIN=Admin
ACCESS_JWT_SECRET_USER=your_access_jwt_secret_user
ACCESS_JWT_SECRET_ADMIN=your_access_jwt_secret_admin
REFRESH_JWT_SECRET_USER=your_refresh_jwt_secret_user
REFRESH_JWT_SECRET_ADMIN=your_refresh_jwt_secret_admin
SALT_ROUND=12
EMAIL_SENDER=your_email@example.com
PASSWORD_FOR_EMAIL_SENDER=your_email_password
CLIENT_ID=your_client_id
SECRET_KEY_PHONE=your_secret_key_for_phone
CLOUD_NAME=your_cloudinary_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret
```

### 4️⃣ Start the Server
```bash
npm run dev
```
Server will be running at `http://localhost:3000`

## 🔗 API Endpoints
### 🔹 User Routes (`/users`)
- `POST /signup` - Register a new user
- `POST /signin` - Login with email & password
- `POST /signInWithGmail` - Google authentication
- `PATCH /updateProfile` - Update user profile
- `POST /friends/request/:friendId` - Send friend request
- `POST /friends/accept/:requesterId` - Accept friend request
- `POST /friends/reject/:requesterId` - Reject friend request

### 🔹 Post Routes (`/posts`)
- `POST /` - Create a new post
- `PATCH /:postId` - Update a post
- `DELETE /:postId` - Delete a post

### 🔹 Comment Routes (`/posts/:postId/comments`)
- `POST /:commentId?` - Add a comment Or reply  to a post
- `PATCH /:commentId` - Update a comment
- `DELETE /:commentId` - Delete a comment
  
_For a full list of endpoints and usage examples, check out the [Postman Docs](https://documenter.getpostman.com/view/26311189/2sAYQdjpve)._ 🚀


## 🔐 Security Features
- **JWT Authentication:** Ensures secure access to user accounts.
- **Role-Based Access Control:** Admin and Super Admin privileges.
- **Rate Limiting:** Prevents abuse by limiting API requests.
- **Input Validation:** Prevents invalid data from being processed.


