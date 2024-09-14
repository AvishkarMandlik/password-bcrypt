const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const mongoConnection = require('./mongoConn/mongoConn');
const { check, validationResult } = require('express-validator');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// Helper function for input sanitization
const sanitizeInput = (input) => {
  return input.replace(/[^\w\s@.-]/gi, ''); // Allow alphanumeric, spaces, and common email characters
};

// Signup API with validation and verification
app.post('/signup',
  // Validation checks
  [
    check('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
    check('email').isEmail().withMessage('Invalid email address'),
    check('phone').isMobilePhone().withMessage('Invalid phone number'),
    check('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    check('role').isIn(['user', 'admin']).withMessage('Role must be either user or admin')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let { username, email, phone, password, role } = req.body;
    
    // Sanitize inputs
    username = sanitizeInput(username);
    email = sanitizeInput(email);
    phone = sanitizeInput(phone);

    const usersCollection = mongoConnection.getCollection('users');

    // Check if username, email, or phone already exists
    const existingUser = await usersCollection.findOne({
      $or: [{ username }, { email }, { phone }]
    });
    if (existingUser) {
      return res.status(400).json({ message: 'Username, email, or phone already exists' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      await usersCollection.insertOne({ username, email, phone, role, password: hashedPassword });

      res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

// Login API with validation


mongoConnection.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch(console.error);
