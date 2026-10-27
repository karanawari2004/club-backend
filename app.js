require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const mongoose = require("mongoose");
const dns = require("dns");

const connectMongo = require("connect-mongo");
const MongoStore =
  connectMongo.MongoStore || connectMongo.default || connectMongo;

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const loginRoutes = require("./Router/loginRouter");
const AdminRouter = require("./Router/AdminRouter");

const app = express();

const isProd = process.env.NODE_ENV === "production";

if (isProd) {
  app.set("trust proxy", 1);
}

// Allowed frontend URLs
const allowedOrigins = [
  "https://club-frontend-zgmp.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
];

// CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an Origin header, such as server-to-server requests.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error("CORS blocked origin:", origin);

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));

// Session configuration
app.use(
  session({
    name: "rizz_session",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),

    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 8 * 60 * 60 * 1000,
    },
  })
);

// API routes
app.use("/api", loginRoutes);
app.use("/api/admin", AdminRouter);

// Backend health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Club Management Backend is running",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler
app.use((err, req, res, next) => {
  if (err.message === "Origin not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "CORS: Frontend origin not allowed",
    });
  }

  console.error("Server error:", err);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

const PORT = process.env.PORT || 4001;

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing");
    }

    if (!process.env.SESSION_SECRET) {
      throw new Error("SESSION_SECRET is missing");
    }

    if (process.env.SESSION_SECRET.length < 32) {
      throw new Error("SESSION_SECRET must be at least 32 characters");
    }

    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
      throw new Error(
        "ADMIN_USERNAME and ADMIN_PASSWORD must be configured"
      );
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully");
    console.log("Database:", mongoose.connection.name);

    app.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
      console.log(`Environment: ${isProd ? "production" : "development"}`);
    });
  } catch (error) {
    console.error("Backend startup failed:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
