const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const config = require('./src/config/env');

// Connect to database
mongoose.connect(config.database.uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const createAdminUser = async () => {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'somaninishit36@gmail.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      name: 'System Administrator',
      email: 'somaninishit36@gmail.com',
      password: 'Nks@071205',
      role: 'admin',
      status: 'active',
      emailVerified: true,
    });

    // Save user (password will be automatically hashed by pre-save middleware)
    await adminUser.save();
    console.log('Admin user created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser();
