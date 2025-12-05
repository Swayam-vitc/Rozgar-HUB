# 🚀 QUICK START - For Your Friends

## Setup in 3 Commands!

```bash
# 1. Clone and navigate
git clone https://github.com/YOUR_USERNAME/RGH.git
cd RGH/rozgaar-hub

# 2. Install everything
npm install && cd backend && npm install && cd ..

# 3. Copy environment file (has all API keys!)
cp backend/.env.example backend/.env
```

## Run It!

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
npm run dev
```

## ✅ Done!

Open: **http://localhost:8080**

---

## What's Already Configured?

- ✅ **MongoDB** - Shared test database for everyone
- ✅ **Razorpay** - Test payment gateway (fake card: 4111 1111 1111 1111)
- ✅ **OpenCage** - Location/geocoding API

**No API key signup needed!** Everything works out of the box.

---

## Shared Database

Everyone uses the same MongoDB database, so:
- You can see jobs/workers created by others
- Great for testing together
- Don't put real/sensitive data

---

## Test Payment

Use this **fake card**:
- Card: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date

No real money charged!

---

## Got Issues?

1. **Can't connect to MongoDB**: Make sure you ran `cp backend/.env.example backend/.env`
2. **Port in use**: Kill the port: `lsof -ti:4000 | xargs kill -9`
3. **Module not found**: Reinstall: `npm install`

---

**That's it!** Check the main README.md for full documentation.
