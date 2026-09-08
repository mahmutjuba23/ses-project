const rateLimit = require('express-rate-limit');

// General login limiter (e.g. 10 attempts per 15 minutes)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// General apply to call limiter (e.g. 5 attempts per 1 minute)
const applyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: 'Too many application attempts, please wait a minute',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginLimiter,
  applyLimiter
};
