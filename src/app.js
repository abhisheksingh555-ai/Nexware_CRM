const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const hpp = require('hpp');
const sanitizeMiddleware = require('./middleware/sanitize');

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const leadRoutes = require('./routes/lead.routes');
const orderRoutes = require('./routes/order.routes');
const productRoutes = require('./routes/product.routes');

const app = express();

/* ----------------------------------------
   🔒 GLOBAL SECURITY MIDDLEWARES
---------------------------------------- */

// Secure HTTP Headers
app.use(helmet());

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Sanitize all incoming user inputs
app.use(sanitizeMiddleware);

// JSON & Form Parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie Parser
app.use(cookieParser());

// CORS (More secure)
// const allowedOrigins = [
//   "http://localhost:5173",
// ];

const allowedOrigins = [
  "https://nexware-crm-frontend.vercel.app"
];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type, Authorization",
  })
);

// Static Upload Folder
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

/* ----------------------------------------
   ROUTES
---------------------------------------- */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);

/* ----------------------------------------
   HEALTH CHECK
---------------------------------------- */
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.get('/', (req, res) => res.send("Server is Running..."));

/* ----------------------------------------
   GLOBAL ERROR HANDLER
---------------------------------------- */
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
