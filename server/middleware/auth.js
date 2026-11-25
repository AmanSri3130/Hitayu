const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'hitayu_super_secret_jwt_key_2026_wellness_ayurveda'
      );

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User account associated with this token no longer exists.'
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error('[Auth Middleware Error]:', error.message);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired authentication token. Please sign in again.'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. Authentication token is required.'
    });
  }
};

module.exports = { protect };
