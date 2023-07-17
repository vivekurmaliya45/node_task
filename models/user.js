const mongoose = require('mongoose');
const { body } = require('express-validator');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
});

// Custom validation messages
const usernameValidation = body('username')
  .trim()
  .notEmpty()
  .withMessage('Username is required.');

const emailValidation = body('email')
  .trim()
  .notEmpty()
  .withMessage('Email is required.')
  .isEmail()
  .withMessage('Invalid email address.');

const passwordValidation = body('password')
  .trim()
  .notEmpty()
  .withMessage('Password is required.')
  .isLength({ min: 6 })
  .withMessage('Password must be at least 6 characters long.');

userSchema.pre('save', function (next) {
  // Validate the user input before saving
  Promise.all([
    usernameValidation.run(this),
    emailValidation.run(this),
    passwordValidation.run(this)
  ])
    .then(() => {
      const errors = validationResult(this);
      if (!errors.isEmpty()) {
        // Handle validation errors
        const errorMessages = errors.array().map(err => err.msg);
        throw new Error(errorMessages.join(' '));
      }
      next();
    })
    .catch(next);
});

const User = mongoose.model('User', userSchema);

module.exports = User;
