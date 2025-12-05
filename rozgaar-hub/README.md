# RozgaarHub - Job Platform for Workers & Employers

A comprehensive job portal connecting workers with employers, featuring real-time chat, payments via Razorpay, calendar scheduling, and wallet system.

## 🚀 Features

- **Dual Role System**: Worker & Employer dashboards
- **Real-time Messaging**: Chat between employers and workers
- **Payment Integration**: Razorpay test mode for payments
- **Worker Wallet**: Add money, withdraw, pay bills, recharge
- **Calendar System**: Schedule work with location tracking (OpenCage Geocoding)
- **Rating System**: Rate workers after job completion
- **Job Applications**: Apply and manage job applications
- **Analytics Dashboard**: Track spending, jobs, and workers

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v16 or higher)
- **MongoDB** (Local or Atlas account)
- **npm** or **yarn**
- **Git**

---

## 🛠️ Super Easy Installation (2 Minutes!)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/RGH.git
cd RGH/rozgaar-hub
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Setup Environment (Just Copy!)

```bash
# Copy the pre-configured environment file
cp backend/.env.example backend/.env
```

**That's it!** ✅ All test API keys are already included:
- ✅ **MongoDB Atlas** - Shared test database (everyone uses same DB)
- ✅ **Razorpay** - Test mode payment keys (no real money)
- ✅ **OpenCage** - Geocoding API for locations

### 4. Run the Application

**Start Backend:**
```bash
cd backend
npm run dev
```

**Start Frontend** (in new terminal):
```bash
# From rozgaar-hub directory
npm run dev
```

🎉 **Done!** Open http://localhost:8080

---

## 📝 What's Included (No Setup Needed!)

All these are **pre-configured** in `.env.example`:

### 🗄️ MongoDB Atlas (Shared Database)
- Already configured!
- Shared test database for everyone
- No need to create your own database
- Data is shared between all users (great for testing together!)

### 💳 Razorpay (Test Payment Gateway)
- Test mode keys included
- Use test card: `4111 1111 1111 1111`
- No real money charged
- Safe to use for learning

### 📍 OpenCage (Location Geocoding)
- Shared API key (2,500 requests/day)
- Converts addresses to coordinates
- Used for calendar location features

**You don't need to get any API keys yourself!** Just copy the `.env.example` file and you're ready to go.

---

## 👥 Test Accounts

After setup, you can create accounts or use these test credentials if seeded:

### Employer Account
- Email: `employer@test.com`
- Password: `password123`

### Worker Account
- Email: `worker@test.com`
- Password: `password123`

---

## 📁 Project Structure

```
rozgaar-hub/
├── backend/
│   ├── src/
│   │   ├── controllers/      # API logic
│   │   ├── models/           # MongoDB schemas
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Auth, error handling
│   │   ├── services/         # External APIs (geocoding)
│   │   └── server.js         # Entry point
│   ├── .env.example          # Environment template
│   └── package.json
│
├── src/
│   ├── pages/                # React pages
│   │   ├── employer/         # Employer dashboard, workers, payments
│   │   └── worker/           # Worker dashboard, jobs, wallet
│   ├── components/           # Reusable UI components
│   ├── lib/                  # API client, utilities
│   └── store/                # State management
│
├── .gitignore                # Git ignore rules
├── package.json              # Frontend dependencies
└── README.md                 # This file
```

---

## 🔧 Configuration Details

### What's in .gitignore (Won't be pushed to GitHub)

- `node_modules/` - Dependencies (reinstall with npm install)
- `.env` files - **Your credentials** (must create manually)
- `dist/` - Build output
- `.DS_Store` - Mac system files

### What IS Included (Will be on GitHub)

- All source code
- `.env.example` - Template for environment variables
- `package.json` - Dependency list
- README.md - Setup instructions

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to MongoDB"

**Solution:**
```bash
# Make sure you copied .env.example to .env
cp backend/.env.example backend/.env

# Restart backend
cd backend
npm run dev
```

The MongoDB connection is already configured! If still having issues, it might be a network/firewall problem.

### Issue: "Port already in use"

**Solution:**
```bash
# Backend (port 4000)
lsof -ti:4000 | xargs kill -9

# Frontend (port 8080)
lsof -ti:8080 | xargs kill -9
```

### Issue: "Module not found"

**Solution:**
```bash
# Reinstall dependencies
npm install

# For backend
cd backend
npm install
```

### Issue: Frontend can't connect to backend

**Solution:**
- Make sure backend is running (check terminal for "Server running on port 4000")
- Frontend should be on http://localhost:8080
- Backend should be on http://localhost:4000

---

## 📝 Important Notes

### 1. Super Simple Setup! 🎉

Just run:
```bash
npm install              # Frontend
cd backend && npm install  # Backend
cp backend/.env.example backend/.env  # Copy environment file
```

**All API keys are included!** You don't need to:
- ❌ Create MongoDB database
- ❌ Get Razorpay keys
- ❌ Get OpenCage key

Everything is ready to use!

### 2. Shared Database

- Everyone uses the same MongoDB database
- You can see data created by others
- Great for testing together!
- **Note:** Don't use for real/production data

### 3. Test Mode Only

- All API keys are for **TESTING only**
- No real money will ever be charged
- Safe to experiment and learn

### 4. For Production Use

If you want to deploy this for real use:
- Get your own MongoDB database
- Get your own Razorpay LIVE keys
- Get your own OpenCage key
- Never share production credentials

---

## 🧪 Testing Payments

### Test Cards (Razorpay Test Mode)

```
Success:
Card: 4111 1111 1111 1111
CVV: Any 3 digits
Expiry: Any future date

Failure:
Card: 4000 0000 0000 0002
CVV: Any
Expiry: Any future date
```

### Test UPI

In test mode, any UPI ID works:
- `success@razorpay`
- `failure@razorpay`

---

## 📱 Features Overview

### For Workers

- ✅ Browse jobs
- ✅ Apply to jobs
- ✅ Accept hire requests
- ✅ View scheduled work in calendar
- ✅ Get location & employer details
- ✅ Wallet (add money, withdraw, pay bills)
- ✅ Track earnings
- ✅ Chat with employers

### For Employers

- ✅ Post jobs
- ✅ Search workers by skills & location
- ✅ Hire workers directly
- ✅ Schedule work with date/time/location
- ✅ Pay workers via Razorpay
- ✅ Rate workers after completion
- ✅ Track total spending
- ✅ Chat with workers
- ✅ View analytics

---

## 🔐 Security Notes

- All routes are protected with JWT authentication
- Passwords are hashed with bcrypt
- Role-based access control (worker/employer)
- CORS configured for frontend origin
- Environment variables for sensitive data

---

## 📦 Dependencies

### Frontend
- React + TypeScript + Vite
- TailwindCSS for styling
- Shadcn/ui components
- FullCalendar for scheduling
- Socket.io-client for real-time chat
- Zustand for state management

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT for authentication
- Razorpay SDK for payments
- OpenCage for geocoding
- Socket.io for real-time features

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is for educational purposes.

---

## 💬 Support

If you encounter issues:

1. Check this README thoroughly
2. Verify all environment variables are set correctly
3. Check console logs for specific errors
4. Ensure both frontend and backend are running
5. Create an issue on GitHub with:
   - Error message
   - Steps to reproduce
   - Your setup (OS, Node version, etc.)

---

## ✅ Setup Checklist (Under 5 Minutes!)

- [ ] Clone repository (`git clone ...`)
- [ ] Install Node.js v16+ if not installed
- [ ] Run `npm install` in root directory
- [ ] Run `npm install` in backend directory
- [ ] Copy environment file: `cp backend/.env.example backend/.env`
- [ ] Start backend: `cd backend && npm run dev`
- [ ] Start frontend: `npm run dev` (in new terminal)
- [ ] Open http://localhost:8080
- [ ] Create test accounts and try features!

**That's it!** 🎉 No API key setup needed!

---

**Happy Coding! 🚀**

For questions, contact the repository owner or open an issue.
