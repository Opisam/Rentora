import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 12); // 12 salt rounds — strong default
    const user = await User.create({ name, email, password: hashedPassword, role });

    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' }); // never leak raw err details to client
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    // Same error message whether email or password is wrong — don't reveal which one
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
}