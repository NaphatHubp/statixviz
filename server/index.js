import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { randomUUID, createHash } from 'node:crypto';
import dns from 'node:dns';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();
const port = Number(process.env.PORT || 3001);
const mongoUri = process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET;
const cookieName = 'statix_session';
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
// MongoDB connection for Vercel
let mongoConnectionPromise;

async function ensureMongoConnection() {
  if (mongoose.connection.readyState === 1) return;

  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    }).catch((error) => {
      mongoConnectionPromise = null;
      throw error;
    });
  }

  await mongoConnectionPromise;
}

app.use(async (req, res, next) => {
  try {
    await ensureMongoConnection();
    next();
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);

    res.status(503).json({
      error: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้'
    });
  }
});

if (!jwtSecret || jwtSecret.length < 32) {
  console.error('Missing or too short JWT_SECRET (minimum 32 characters)');
  process.exit(1);
}

if (!mongoUri) {
  console.error('Missing environment variable: MONGODB_URI');
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, select: false }
}, { timestamps: true, versionKey: false });

const problemSchema = new mongoose.Schema({
  problemId: { type: String, required: true, unique: true, index: true },
  fingerprint: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  distributionType: { type: String, required: true },
  inputParams: { type: mongoose.Schema.Types.Mixed, default: {} },
  outputResult: { type: mongoose.Schema.Types.Mixed, required: true },
  solvedCount: { type: Number, default: 1 },
  viewCount: { type: Number, default: 1 },
  executionTimeMs: { type: Number, default: 0 },
  lastSolvedAt: { type: Date, default: Date.now }
}, { timestamps: true, versionKey: false, collection: 'problems' });
problemSchema.index({ updatedAt: -1 });

const User = mongoose.model('User', userSchema);
const Problem = mongoose.model('Problem', problemSchema);

function formatProblem(doc) {
  return {
    id: doc.id || String(doc._id),
    problemId: doc.problemId,
    fingerprint: doc.fingerprint,
    userId: doc.userId,
    userName: doc.userName,
    distributionType: doc.distributionType,
    inputParams: doc.inputParams || {},
    outputResult: doc.outputResult || {},
    solvedCount: Number(doc.solvedCount || 0),
    viewCount: Number(doc.viewCount || 0),
    executionTimeMs: Number(doc.executionTimeMs || 0),
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString().slice(0, 16).replace('T', ' ') : '',
    lastSolvedAt: doc.lastSolvedAt ? new Date(doc.lastSolvedAt).toISOString().slice(0, 16).replace('T', ' ') : ''
  };
}

app.get('/api/health', async (_req, res) => {
  const connected = mongoose.connection.readyState === 1;
  if (!connected) return res.status(503).json({ status: 'error', database: 'disconnected' });
  try {
    await mongoose.connection.db.admin().ping();
    res.json({ status: 'ok', database: 'connected', provider: 'MongoDB' });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'disconnected', message: error.message });
  }
});

const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email });
const setSession = (res, user) => {
  const token = jwt.sign({ sub: user.id }, jwtSecret, { expiresIn: '7d', algorithm: 'HS256' });
  res.cookie(cookieName, token, {
    httpOnly: true, secure: isProduction, sameSite: 'lax',
    path: '/', maxAge: 7 * 24 * 60 * 60 * 1000
  });
};
async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[cookieName];

    if (!token) {
      return res.status(401).json({
        error: 'กรุณาเข้าสู่ระบบ'
      });
    }

    const claims = jwt.verify(token, jwtSecret, {
      algorithms: ['HS256']
    });

    const user = await User.findOne({
      id: claims.sub
    })
    .select('+passwordHash')
    .lean();

    // Debug โดยไม่แสดงข้อมูลลับ
    console.log('JWT user found:', !!user);
    console.log('Has passwordHash:', !!user?.passwordHash);

    if (!user || !user.passwordHash) {
      return res.status(401).json({
        error: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่'
      });
    }

    req.authUser = user;
    next();

  } catch (error) {
    console.error('JWT verify error:', error.name);

    return res.status(401).json({
      error: 'เซสชันไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่'
    });
  }
}

app.post('/api/auth/register', async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = req.body?.password;
  if (!name || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      || email.length > 254 || typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'กรุณากรอกชื่อ อีเมล และรหัสผ่าน 8–128 ตัวอักษรให้ถูกต้อง' });
  }
  try {
    if (await User.exists({ email })) return res.status(409).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ id: `usr_${randomUUID()}`, name, email, passwordHash });
    setSession(res, user);
    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });
    console.error('Register:', error.message);
    res.status(500).json({ error: 'สมัครสมาชิกไม่สำเร็จ' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = req.body?.password;
  if (typeof password !== 'string' || !email) return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' });
  try {
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }
    setSession(res, user);
    res.json({ user: publicUser(user) });
  } catch (error) {
    console.error('Login:', error.message);
    res.status(500).json({ error: 'เข้าสู่ระบบไม่สำเร็จ' });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: publicUser(req.authUser) }));
app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie(cookieName, { httpOnly: true, secure: isProduction, sameSite: 'lax', path: '/' });
  res.json({ message: 'ออกจากระบบสำเร็จ' });
});

app.get('/api/problems', async (_req, res) => {
  try {
    const docs = await Problem.find().sort({ updatedAt: -1 }).limit(500).lean();
    res.json(docs.map(formatProblem));
  } catch (error) {
    console.error('GET /api/problems:', error.message);
    res.status(500).json({ error: 'อ่านข้อมูลโจทย์ไม่สำเร็จ กรุณาตรวจสอบการตั้งค่า MongoDB' });
  }
});

app.post('/api/problems', requireAuth, async (req, res) => {
  const { fingerprint, distributionType, inputParams, outputResult, executionTimeMs } = req.body || {};
  const userId = req.authUser.id;
  const userName = req.authUser.name;
  if (!fingerprint || !userId || !userName || !distributionType || outputResult == null) {
    return res.status(400).json({ error: 'ข้อมูลโจทย์ไม่ครบถ้วน' });
  }

  const fingerprintHash = createHash('sha256').update(String(fingerprint)).digest('hex');
  const problemId = `STAT-${Date.now().toString().slice(-8)}-${randomUUID().slice(0, 4).toUpperCase()}`;
  const now = new Date();

  try {
    // Existing fingerprints increment counters; new fingerprints start at 1.
    let problem = await Problem.findOneAndUpdate(
      { fingerprint: fingerprintHash },
      {
        $set: {
          userId: String(userId), userName: String(userName), distributionType: String(distributionType),
          inputParams: inputParams || {}, outputResult, executionTimeMs: Number(executionTimeMs || 0), lastSolvedAt: now
        },
        $inc: { solvedCount: 1, viewCount: 1 },
        $setOnInsert: { problemId, fingerprint: fingerprintHash }
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();

    // $inc on an upsert initializes counters at 1 when schema defaults apply.
    const isNew = problem.createdAt && Math.abs(new Date(problem.createdAt).getTime() - now.getTime()) < 3000;
    res.status(isNew ? 201 : 200).json({
      message: isNew ? `บันทึกโจทย์ใหม่ ${problem.problemId} สำเร็จ` : `อัปเดตสถิติ ${problem.problemId} สำเร็จ`,
      problemId: problem.problemId
    });
  } catch (error) {
    // If two requests create the same fingerprint concurrently, fetch the winning record.
    if (error.code === 11000) {
      try {
        const problem = await Problem.findOneAndUpdate(
          { fingerprint: fingerprintHash },
          { $set: { userId: String(userId), userName: String(userName), distributionType: String(distributionType), inputParams: inputParams || {}, outputResult, executionTimeMs: Number(executionTimeMs || 0), lastSolvedAt: now }, $inc: { solvedCount: 1, viewCount: 1 } },
          { new: true }
        ).lean();
        if (problem) return res.json({ message: `อัปเดตสถิติ ${problem.problemId} สำเร็จ`, problemId: problem.problemId });
      } catch (retryError) { console.error('POST /api/problems retry:', retryError.message); }
    }
    console.error('POST /api/problems:', error.message);
    res.status(500).json({ error: 'บันทึกโจทย์ไม่สำเร็จ กรุณาตรวจสอบการตั้งค่า MongoDB' });
  }
});

async function start() {
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log(`Connected to MongoDB database: ${mongoose.connection.name}`);
    app.listen(port, () => console.log(`StatixViz API listening at http://localhost:${port}`));
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

if (!process.env.VERCEL) {
  start();
}

export default app;
