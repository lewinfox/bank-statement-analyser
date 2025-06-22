const express = require('express');
const userService = require('../services/userService');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await userService.createUser(username, password);
    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    if (error.message === 'Username already exists') {
      return res.status(409).json({ error: error.message });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await userService.authenticateUser(username, password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('Login successful for user:', user);
    console.log('Setting session userId to:', user.id);
    req.session.userId = user.id;
    console.log('Session after setting userId:', req.session);
    console.log('Session ID:', req.sessionID);
    
    res.json({ message: 'Login successful', user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

router.get('/me', async (req, res) => {
  try {
    console.log('Auth /me endpoint called');
    console.log('Session ID:', req.sessionID);
    console.log('Session data:', req.session);
    console.log('User ID from session:', req.session.userId);
    
    if (!req.session.userId) {
      console.log('No userId in session, returning 401');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await userService.findUserById(req.session.userId);
    console.log('User found:', user);
    
    if (!user) {
      console.log('User not found in database, returning 401');
      return res.status(401).json({ error: 'User not found' });
    }

    console.log('Returning user data');
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;