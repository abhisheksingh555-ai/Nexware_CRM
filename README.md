# Nexware_CRM

Nexware_CRM is a lightweight, customizable Customer Relationship Management (CRM) system designed to help businesses manage leads, clients, sales pipelines, and internal workflows efficiently. It provides an intuitive interface and modular architecture, making it ideal for small to medium-sized teams looking for a simple yet scalable CRM solution.

---

## Environment Variables

# Create a `.env` file and define the following:

# Server Configuration
- PORT=5000
- NODE_ENV=PRODUCTION

# Database
- MONGO_URI=YOUR_MONGODB_URL

# Authentication
- JWT_SECRET=your_jwt_secret_key_here
- JWT_EXPIRE=7d

# Developer Access
- DEVELOPER_SECRET=YOUR_DEVELOPMENT_KEY

# Cloudinary Configuration
- CLOUDINARY_NAME=YOUR_CLOUDINARY_NAME
- CLOUDINARY_KEY=YOUR_CLOUDINARY_KEY
- CLOUDINARY_SECRET=YOUR_CLOUDINARY_SECRET
 

---

## Backend Overview

This is the backend scaffold for Nexware CRM, built with Node.js, Express, and MongoDB. The backend includes:

- **User Authentication & Authorization** (Admin, Subadmin, Teamhead, Agent)  
- **Role-based Access Control (RBAC)**  
- **Secure Password Handling & Validation**  
- **CRUD Operations for Users**  
- **Status Management** (Active/Inactive)  
- **Secret Developer Registration Endpoint**  

---

## Installation & Quick Start

1. Clone the repository:  
   ```bash
   git clone https://github.com/abhisheksingh01-ai/Nexware_CRM.git
   cd Nexware_CRM
2. Install dependencies:

    ```bash
    npm install
3. Create .env from .env.example and set your environment variables.

4. Start the development server:

   ```bash
   npm run dev

API Endpoints

| Method | Endpoint           | Access    | Description                      |
| ------ | ------------------ | --------- | -------------------------------- |
| POST   | `/login`           | Public    | Login user                       |
| POST   | `/register-secret` | Developer | Register a user secretly (agent) |


User Routes

| Method | Endpoint        | Access                    | Description                            |
| ------ | --------------- | ------------------------- | -------------------------------------- |
| POST   | `/users`        | Admin                     | Create user                            |
| GET    | `/users`        | Admin, Subadmin, Teamhead | View users list                        |
| PUT    | `/users/:id`    | Authenticated users       | Update user (role-based restrictions)  |
| DELETE | `/users/:id`    | Admin                     | Delete user (cannot delete last admin) |
| PUT    | `/users/status` | Admin                     | Update status (active/inactive)        |

# Validation Rules
 ### User Registration

- **Name:** 2-50 characters  
- **Email:** Valid email  
- **Password:** Minimum 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character  
- **Role:** admin, subadmin, teamhead, agent  
- **Phone:** 10-digit number (optional)  
- **teamHeadId:** Required if role is agent  
- **Status:** active / inactive (default active)

### User Update

- **Admin:** Can update any field for any user  
- **Subadmin / Teamhead / Agent:** Can update only themselves, allowed fields: name, phone, password  
- **Cannot update:** email, role, status, teamHeadId, other users  

### Login

- **Email:** Required, must be valid  
- **Password:** Required  

### Security Features

- Passwords are hashed using **bcrypt**  
- JWT-based authentication  
- Role-based access control (**RBAC**)  
- Input validation with **Joi**  
- Enhanced security headers using **Helmet**  
- Login brute-force protection using **express-rate-limit**  
- XSS protection using **sanitize-html**  
- Prevent HTTP Parameter Pollution using **HPP**  
- Prevent NoSQL Injection using **express-mongo-sanitize**  
- Secure CORS configuration with credentials  
- Centralized error handling without leaking sensitive information  


### Testing

- **Roles:** Admin, Subadmin, Teamhead, and Agent can be tested with separate JSON payloads.  
- **API Behavior:** All endpoints return appropriate HTTP status codes and messages for unauthorized, invalid, or forbidden requests.  
- **Security Testing:** Includes attempts to bypass RBAC, XSS injection, invalid roles, and updating restricted fields.

### Notes

- Only Admin can manage users fully, including roles and status.  
- Subadmin and Teamhead can view users based on assigned scope.  
- Agents have minimal privileges.  
- Developer secret allows internal registration of agents.  

---

I can also **create a super clean “Postman-ready JSON collection”** for all endpoints, including Admin, Subadmin, Teamhead, and Agent testing.

