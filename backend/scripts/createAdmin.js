/**
 * Secure Initial Administrator Provisioning Script
 * Cloud-Based Smart Parking Management System
 * 
 * Usage:
 *   node scripts/createAdmin.js [email] [password] [name]
 * 
 * Example:
 *   node scripts/createAdmin.js admin@parking.com SecureAdminPass123! "Super Admin"
 *   npm run create-admin
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config();

const createInitialAdmin = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_parking_db';

  // Read CLI arguments or fallback to environment variables or safe defaults
  const args = process.argv.slice(2);
  const email = (args[0] || process.env.INITIAL_ADMIN_EMAIL || 'admin@parking.com').toLowerCase().trim();
  const password = args[1] || process.env.INITIAL_ADMIN_PASSWORD || 'AdminPassword123!';
  const name = args[2] || process.env.INITIAL_ADMIN_NAME || 'Smart Parking System Administrator';
  const phone = '+91 98765 43210';

  console.log('===============================================================');
  console.log('  SECURE INITIAL ADMIN ACCOUNT PROVISIONING TOOL               ');
  console.log('===============================================================');
  console.log(`Connecting to: ${uri.includes('mongodb.net') ? 'MongoDB Atlas (Cloud)' : 'MongoDB (Local)'}...`);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log('[Connected] Database connection established successfully.\n');

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      console.log(`Found existing user account for "${email}".`);
      user.role = 'admin';
      if (args[1]) {
        // If password explicitly passed via CLI, update it
        user.password = password;
      }
      await user.save();
      console.log(`[Success] User "${email}" has been elevated to role: "admin".`);
    } else {
      console.log(`Creating new administrator account for "${email}"...`);
      user = await User.create({
        name,
        email,
        password, // Pre-save hook hashes with bcrypt automatically
        role: 'admin',
        phone,
        vehicleNumber: 'ADMIN-01',
        vehicleType: 'Four-Wheeler',
      });
      console.log(`[Success] Administrator "${user.name}" created with role: "admin".`);
    }

    console.log('---------------------------------------------------------------');
    console.log(' Admin Account Details:');
    console.log(`   - Name:    ${user.name}`);
    console.log(`   - Email:   ${user.email}`);
    console.log(`   - Role:    ${user.role}`);
    console.log(`   - Password: [Protected with bcrypt salt & hash]`);
    console.log('---------------------------------------------------------------');
    console.log('Security Note:');
    console.log(' Standard user registration strictly defaults to "customer".');
    console.log(' Only users provisioned via this script or providing ADMIN_SECRET_KEY');
    console.log(' can obtain the "admin" role.');
    console.log('===============================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n[Provisioning Error]:', error.message);
    if (error.message.includes('buffering timed out') || error.message.includes('ECONNREFUSED')) {
      console.log('\n---------------------------------------------------------------');
      console.log('💡 MongoDB Connection Tip:');
      console.log('  1. For Cloud Database (Recommended):');
      console.log('     Configure your MongoDB Atlas cluster URI in backend/.env:');
      console.log('     MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/smart_parking_db');
      console.log('  2. For Local Database:');
      console.log('     Ensure the local MongoDB daemon is running: mongod');
      console.log('---------------------------------------------------------------\n');
    }
    process.exit(1);
  }
};

createInitialAdmin();
