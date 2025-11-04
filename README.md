# Budget Tracker Backend API

A robust Node.js backend API for the Budget Tracker application, built with Express.js, Sequelize ORM, and PostgreSQL. Features JWT authentication, email verification, and session management.

## 🚀 Features

- **JWT Authentication** - Secure token-based authentication system
- **Email Verification** - Email verification flow for new user registrations
- **Session Management** - Track user sessions with IP and device information
- **SMTP Email Service** - Send welcome emails, login notifications, and verification emails
- **Password Security** - Bcrypt password hashing
- **Input Validation** - Express-validator for request validation
- **Environment Configuration** - Separate configs for development and production
- **CORS Support** - Configurable CORS for frontend integration
- **Error Handling** - Comprehensive error handling with proper status codes

## 📋 Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- SMTP email account (optional, for email functionality)

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/lighty7/Finances_backend.git
cd Finances_backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
cp ENV_TEMPLATE.txt .env
```

4. Configure your `.env` file with your settings (see Environment Variables section below)

5. Set up your PostgreSQL database and update the `DATABASE_URL` in `.env`

## ⚙️ Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Environment (development or production)
NODE_ENV=development

# Server Configuration
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-minimum-32-characters
JWT_EXPIRES_IN=7d

# Email Configuration
EMAIL_ENABLED=false
EMAIL_FROM_NAME=Budget Tracker
EMAIL_FROM_ADDRESS=noreply@budgettracker.com

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password-or-password
SMTP_REJECT_UNAUTHORIZED=true

# Frontend URL (for email verification links)
FRONTEND_URL=http://localhost:5173

# CORS Configuration (for production - comma-separated list)
# CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

### SMTP Configuration Notes

**For Gmail:**
- Enable 2FA on your Google account
- Generate an App Password at: https://myaccount.google.com/apppasswords
- Use the App Password (not your regular password) in `SMTP_PASSWORD`

**Common SMTP Providers:**
- **Gmail**: `smtp.gmail.com:587` (secure: false) or `:465` (secure: true)
- **Outlook**: `smtp-mail.outlook.com:587` (secure: false)
- **Yahoo**: `smtp.mail.yahoo.com:587` (secure: false) or `:465` (secure: true)
- **SendGrid**: `smtp.sendgrid.net:587` (secure: false)
- **Mailgun**: `smtp.mailgun.org:587` (secure: false)

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```
The server will start on `http://localhost:3000` with hot-reload enabled.

### Production Mode
```bash
npm start
```

## 📚 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/logout` | User logout | No |
| GET | `/api/auth/verify` | Verify JWT token | Yes |
| GET | `/api/auth/session` | Get current session info | Yes |
| GET | `/api/auth/sessions` | Get all active sessions | Yes |
| POST | `/api/auth/logout-all` | Logout from all devices | Yes |

### User Routes (`/api/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/users` | Register new user | No |
| POST | `/api/users/verify-email` | Verify email address | No |
| POST | `/api/users/resend-verification` | Resend verification email | No |
| GET | `/api/users` | Get all users | Yes |
| GET | `/api/users/:id` | Get user by ID | Yes |
| PUT | `/api/users/:id` | Update user | Yes |
| DELETE | `/api/users/:id` | Delete user | Yes |

## 📝 API Request/Response Examples

### Register User
```bash
POST /api/users
Content-Type: application/json

{
  "userName": "johndoe",
  "emailId": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "User created successfully. Please check your email to verify your account.",
  "user": {
    "id": 1,
    "userName": "johndoe",
    "emailId": "john@example.com",
    "isVerified": false
  },
  "verificationEmailSent": true
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "emailId": "john@example.com",
  "password": "password123",
  "deviceId": "optional-device-id"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "userName": "johndoe",
    "emailId": "john@example.com",
    "isVerified": true
  },
  "session": {
    "id": 1,
    "deviceId": "device-id",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  }
}
```

### Verify Email
```bash
POST /api/users/verify-email
Content-Type: application/json

{
  "token": "verification-token-from-email"
}
```

**Response:**
```json
{
  "message": "Email verified successfully. You can now login to your account.",
  "user": {
    "id": 1,
    "userName": "johndoe",
    "emailId": "john@example.com",
    "isVerified": true
  }
}
```

## 🔐 Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Token Format
- Tokens expire after 7 days (configurable via `JWT_EXPIRES_IN`)
- Tokens are automatically validated on protected routes
- Invalid or expired tokens return `401 Unauthorized`

## 📦 Project Structure

```
Finances_backend/
├── config/
│   └── config.js          # Environment configuration
├── controller/
│   ├── auth.Controller.js  # Authentication logic
│   └── user.Controller.js  # User management logic
├── middleware/
│   ├── auth.js            # JWT authentication middleware
│   └── validation.js      # Request validation middleware
├── models/
│   ├── index.js           # Sequelize initialization
│   ├── users.js           # User model
│   └── userSessions.js    # Session model
├── routes/
│   ├── auth.routes.js     # Authentication routes
│   └── users.routes.js    # User routes
├── utils/
│   ├── emailService.js    # SMTP email service
│   └── ipHelper.js        # IP and device info extraction
├── index.js               # Application entry point
├── package.json
├── ENV_TEMPLATE.txt      # Environment variables template
└── README.md
```

## 🗄️ Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `userName` (String, Unique, Required)
- `emailId` (String, Unique, Required)
- `password` (String, Hashed, Required)
- `isVerified` (Boolean, Default: false)
- `verificationToken` (String, Unique, Nullable)
- `verificationTokenExpiry` (DateTime, Nullable)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### UserSessions Table
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key → Users.id)
- `deviceId` (String)
- `ipAddress` (String)
- `userAgent` (String)
- `token` (String)
- `isActive` (Boolean, Default: true)
- `lastActivity` (DateTime)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

## 🔒 Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Input Validation**: Express-validator for all inputs
- **Email Verification**: Required before login
- **Session Tracking**: IP and device tracking for security
- **CORS Protection**: Configurable CORS for production
- **Error Handling**: No sensitive data in error responses

## 🧪 Development vs Production

### Development Mode
- Auto-syncs database schema
- Shows detailed error stacks
- Logs all SQL queries
- Allows all CORS origins
- Detailed request logging

### Production Mode
- No auto-sync (manual migrations required)
- Hides error details
- Minimal logging
- Restricted CORS origins
- Security-focused settings

## 🐛 Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error type",
  "message": "Human-readable error message"
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/expired token)
- `403` - Forbidden (email not verified)
- `404` - Not Found
- `500` - Internal Server Error

## 📧 Email Service

The email service sends:
- **Welcome Email**: Sent after user registration
- **Verification Email**: Sent with verification link
- **Login Notification**: Sent after successful login with device/IP info

To enable email functionality:
1. Set `EMAIL_ENABLED=true` in `.env`
2. Configure SMTP settings
3. Ensure SMTP credentials are correct

## 🔄 User Flow

1. **Registration**: User registers → Receives verification email
2. **Email Verification**: User clicks verification link → Email verified
3. **Login**: User logs in → Receives login notification email
4. **Session Management**: User can view and manage active sessions

## 📝 Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run development` - Alias for `npm run dev`
- `npm run production` - Alias for `npm start`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🔗 Related Repositories

- Frontend: [Finances_Frontend](https://github.com/lighty7/Finances_Frontend)

## 📞 Support

For issues and questions, please open an issue on GitHub.

## 🎯 Future Enhancements

- [ ] Password reset functionality
- [ ] Two-factor authentication
- [ ] Rate limiting
- [ ] API documentation with Swagger/OpenAPI
- [ ] Unit and integration tests
- [ ] Docker containerization
- [ ] CI/CD pipeline

