const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect middleware: Verify JWT token & derive user identity strictly from token
 */
const protect = async (req, res, next) => {
  let token;

  // Check for Bearer token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Access denied: Authentication token format invalid.',
        });
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smart_parking_jwt_super_secret_key_2026');

      // Fetch user from database and exclude password
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists.',
        });
      }

      // User identity securely derived from token
      next();
    } catch (error) {
      console.error('[Auth Middleware Error]:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized: Token verification failed or token expired.',
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: No Bearer token provided in Authorization header.',
    });
  }
};

/**
 * Role-based authorization middleware (e.g. authorize('admin'))
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before checking permissions.',
      });
    }

    // Treat 'customer' and 'user' as standard customer roles
    const userRole = req.user.role;
    const isAuthorized = roles.some((role) => {
      if (role === 'customer' || role === 'user') {
        return userRole === 'customer' || userRole === 'user';
      }
      return userRole === role;
    });

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted. Role '${userRole}' is not permitted to perform this action.`,
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
