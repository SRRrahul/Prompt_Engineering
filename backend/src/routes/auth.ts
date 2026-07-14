import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { uid } from '../config/db';

const router = Router();

// POST /api/auth/examiner/register
router.post('/examiner/register', async (req: Request, res: Response) => {
  try {
    const { name, email, department, username, password } = req.body;

    if (!name || !email || !username || !password) {
      return res.status(400).json({ message: 'Name, email, username, and password are all required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.trim();

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUsername)) {
      return res.status(400).json({ message: 'Username must be 3–20 characters and contain only letters, numbers, or underscores.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }
    if (!/\d/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one number.' });
    }

    if (await User.findOne({ email: cleanEmail })) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    if (await User.findOne({ username: cleanUsername })) {
      return res.status(409).json({ field: 'username', message: 'This username is already taken. Please choose another.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date().toISOString();

    await User.create({
      _id: uid(),
      role: 'examiner',
      name: name.trim(),
      email: cleanEmail,
      username: cleanUsername,
      passwordHash,
      department: department?.trim() || '',
      examStatus: 'not_started',
      registeredAt: now,
    });

    return res.status(201).json({ message: 'Registration successful. You can now log in with your chosen credentials.' });
  } catch (error: any) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Registration failed. Please try again.', error: error.message });
  }
});

// POST /api/auth/examiner/login
router.post('/examiner/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password are required' });

    const u = username.trim();
    const user = await User.findOne({
      $or: [{ username: u }, { email: u.toLowerCase() }],
      role: 'examiner'
    });

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'gtec_secret',
      { expiresIn: '8h' } as any
    );

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, username: user.username, department: user.department, examStatus: user.examStatus }
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// POST /api/auth/admin/login
router.post('/admin/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password are required' });

    const u = username.trim();
    const user = await User.findOne({
      $or: [{ username: u }, { email: u.toLowerCase() }],
      role: 'admin'
    });

    if (!user) return res.status(401).json({ message: 'Invalid admin credentials' });
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return res.status(401).json({ message: 'Invalid admin credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'gtec_secret',
      { expiresIn: '12h' } as any
    );

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, username: user.username }
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

export default router;
