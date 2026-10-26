const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Helper to generate JWT Token
 */
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'smart_parking_jwt_super_secret_key_2026',
    { expiresIn: '7d' }
  );
};

/**
 * @desc    Register a new customer or administrator
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      vehicleNumber,
      vehicleType,
      adminSecretKey,
    } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Role assignment security:
    // Never make every registering user an admin.
    // Default to 'customer'. Admin requires matching ADMIN_SECRET_KEY.
    let assignedRole = 'customer';

    if (role === 'admin') {
      const validAdminKey = process.env.ADMIN_SECRET_KEY || 'admin123';
      if (!adminSecretKey || adminSecretKey !== validAdminKey) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Invalid or missing Admin Secret Passkey. Unauthorized attempt to create an administrator account.',
        });
      }
      assignedRole = 'admin';
    } else if (role === 'user' || role === 'customer') {
      assignedRole = 'customer';
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists. Please log in.',
      });
    }

    // Create user in MongoDB (password will be hashed via pre-save hook)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: assignedRole,
      phone: phone ? phone.trim() : '',
      vehicleNumber: vehicleNumber ? vehicleNumber.toUpperCase().trim() : '',
      vehicleType: vehicleType || 'Four-Wheeler',
    });

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: `${assignedRole === 'admin' ? 'Administrator' : 'Customer'} registered successfully!`,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        vehicleNumber: user.vehicleNumber,
        vehicleType: user.vehicleType,
      },
    });
  } catch (error) {
    console.error('[Register Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error occurred during user registration.',
    });
  }
};

/**
 * @desc    Authenticate customer or admin and return JWT
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate request inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. No account found with this email.',
      });
    }

    // Verify password using bcrypt
    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password is incorrect.',
      });
    }

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        vehicleNumber: user.vehicleNumber,
        vehicleType: user.vehicleType,
      },
    });
  } catch (error) {
    console.error('[Login Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error occurred during login.',
    });
  }
};

/**
 * @desc    Get currently logged in user profile (derived from JWT)
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    // req.user was populated by protect middleware
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error retrieving user profile.',
    });
  }
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, vehicleNumber, vehicleType } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (vehicleNumber !== undefined) user.vehicleNumber = vehicleNumber.toUpperCase().trim();
    if (vehicleType) user.vehicleType = vehicleType;

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        vehicleNumber: updatedUser.vehicleNumber,
        vehicleType: updatedUser.vehicleType,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error occurred while updating profile.',
    });
  }
};
