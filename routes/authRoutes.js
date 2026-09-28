// routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { signToken, requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// ============================================================
// POST /api/auth/signup — Create a new user + wallet
// ============================================================
router.post('/signup', async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const validRoles = ['BUYER', 'SELLER', 'COURIER', 'ADMIN'];
    const safeRole = validRoles.includes(role) ? role : 'BUYER';

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        roles: [safeRole],
        kycStatus: 'UNVERIFIED',
        wallet: {
          create: {
            availableBalanceCents: 0n,
            lockedBalanceCents: 0n,
            currency: 'USD',
          },
        },
      },
      include: { wallet: true },
    });

    const token = signToken(user.id, user.roles.includes('ADMIN'));

    res.status(201).json({
      token,
      user: {
        id: user.id,
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
        roles: user.roles,
        kycStatus: user.kycStatus,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed', details: error.message });
  }
});

// ============================================================
// POST /api/auth/login — Authenticate and return JWT
// ============================================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.kycStatus === 'FLAGGED_FRAUD') {
      return res.status(403).json({ error: 'Your account is restricted. Please contact support.' });
    }

    const token = signToken(user.id, user.roles.includes('ADMIN'));

    res.json({
      token,
      user: {
        id: user.id,
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
        roles: user.roles,
        kycStatus: user.kycStatus,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// ============================================================
// GET /api/auth/me — Return current user from token
// ============================================================
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { wallet: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      roles: user.roles,
      kycStatus: user.kycStatus,
      wallet: user.wallet
        ? {
            availableBalanceCents: user.wallet.availableBalanceCents.toString(),
            lockedBalanceCents: user.wallet.lockedBalanceCents.toString(),
            currency: user.wallet.currency,
          }
        : null,
    });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Failed to fetch user', details: error.message });
  }
});

module.exports = router;
