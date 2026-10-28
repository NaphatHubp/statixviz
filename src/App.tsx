import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  BarChart2,
  Calculator,
  Database,
  User,
  LogIn,
  LogOut,
  Save,
  Sparkles,
  TrendingUp,
  Cpu,
  CheckCircle2,
  Terminal,
  Activity,
  Sliders,
  RotateCcw,
  ListOrdered,
  Flame,
  Clock,
  Eye,
  Plus,
  Trash2,
  Search,
  BookOpen
} from 'lucide-react';

// ============================================================================
// 1. OBJECT-ORIENTED PROGRAMMING (OOP) CORE ENGINE
// ============================================================================

/**
 * COMPOSITION CLASS: DataPoint
 */
class DataPoint {
  protected x: number;
  protected y: number;

  constructor(x: number, y: number) {
    this.x = Number(x);
    this.y = Number(y);
  }

  getX(): number { return this.x; }
  getY(): number { return this.y; }
}

/**
 * COMPOSITION CLASS: Dataset
 * Encapsulates raw array observations and performs statistical reductions
 */
class Dataset {
  protected points: DataPoint[];

  constructor(points: Array<DataPoint | { x: number; y: number }> = []) {
    this.points = points.map(p =>
      p instanceof DataPoint
        ? p
        : new DataPoint(p.x, p.y)
    );
  }

  getPoints(): DataPoint[] {
    return [...this.points];
  }

  addPoint(x, y) {
    this.points.push(new DataPoint(x, y));
  }

  removePoint(index) {
    this.points.splice(index, 1);
  }

  get count() { return this.points.length; }

  get meanX() {
    if (this.count === 0) return 0;
    return this.points.reduce((sum, p) => sum + p.getX(), 0) / this.count;
  }

  get meanY() {
    if (this.count === 0) return 0;
    return this.points.reduce((sum, p) => sum + p.getY(), 0) / this.count;
  }

  get varianceX() {
    if (this.count <= 1) return 0;
    const mx = this.meanX;
    return this.points.reduce((sum, p) => sum + Math.pow(p.getX() - mx, 2), 0) / (this.count - 1);
  }

  get covariance() {
    if (this.count <= 1) return 0;
    const mx = this.meanX;
    const my = this.meanY;
    return this.points.reduce((sum, p) => sum + (p.getX() - mx) * (p.getY() - my), 0) / (this.count - 1);
  }
}

/**
 * ABSTRACT BASE CLASS: Distribution
 * Defines standard OOP interface for all statistical distributions
 */
class Distribution {
  protected type: string;
  protected params: Record<string, any>;
  protected dataset: Dataset | null;
  protected instanceId: string;
  protected createdAt: string;

  constructor(type: string, params: Record<string, any> = {}, dataset: Dataset | null = null) {
    if (this.constructor === Distribution) {
      throw new Error("Cannot instantiate Abstract Class 'Distribution' directly.");
    }
    this.type = type;
    this.params = params;
    this.dataset = dataset;
    this.instanceId = 'dist_' + Math.random().toString(36).substring(2, 9);
    this.createdAt = new Date().toISOString();
  }

  // Abstract Methods
  calculateProbability(x1, x2 = null) {
    throw new Error("Abstract method 'calculateProbability()' must be implemented.");
  }

  calculatePDF(x) {
    throw new Error("Abstract method 'calculatePDF()' must be implemented.");
  }

  getSummaryStats() {
    throw new Error("Abstract method 'getSummaryStats()' must be implemented.");
  }

  formatFormula() {
    throw new Error("Abstract method 'formatFormula()' must be implemented.");
  }

  getType(): string {
    return this.type;
  }

  getClassName() {
    return this.constructor.name;
  }
}

/**
 * CONCRETE CLASS 1: NormalDistribution (Gaussian)
 */
class NormalDistribution extends Distribution {
  protected mean: number;
  protected stdDev: number;

  constructor(mean = 0, stdDev = 1) {
    super('Normal (การแจกแจงปกติ)', { mean: Number(mean), stdDev: Number(stdDev) });
    this.mean = Number(mean);
    this.stdDev = Number(stdDev) > 0 ? Number(stdDev) : 1;
  }

  // Error function approximation for Gaussian Cumulative Distribution Function (CDF)
  cdf(x) {
    const z = (x - this.mean) / this.stdDev;
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z >= 0 ? 1 - prob : prob;
  }

  calculateProbability(x1, x2 = null) {
    if (x2 === null) {
      // P(X <= x1)
      const prob = this.cdf(x1);
      const z = (x1 - this.mean) / this.stdDev;
      return {
        prob,
        z1: z,
        z2: null,
        expression: `P(X ≤ ${x1}) = ${prob.toFixed(4)} (Z = ${z.toFixed(2)})`
      };
    } else {
      // P(x1 <= X <= x2)
      const prob1 = this.cdf(x1);
      const prob2 = this.cdf(x2);
      const prob = Math.abs(prob2 - prob1);
      const z1 = (x1 - this.mean) / this.stdDev;
      const z2 = (x2 - this.mean) / this.stdDev;
      return {
        prob,
        z1,
        z2,
        expression: `P(${x1} ≤ X ≤ ${x2}) = ${prob.toFixed(4)}`
      };
    }
  }

  calculatePDF(x) {
    const normFactor = 1 / (this.stdDev * Math.sqrt(2 * Math.PI));
    const exponent = -Math.pow(x - this.mean, 2) / (2 * Math.pow(this.stdDev, 2));
    return normFactor * Math.exp(exponent);
  }

  getSummaryStats() {
    return {
      mean: this.mean,
      variance: Math.pow(this.stdDev, 2),
      stdDev: this.stdDev,
      skewness: 0,
      kurtosis: 3
    };
  }

  formatFormula() {
    return "f(x) = (1 / (σ√(2π))) · e^(-(x - μ)² / (2σ²))";
  }
}

/**
 * CONCRETE CLASS 2: BinomialDistribution
 */
class BinomialDistribution extends Distribution {
  protected n: number;
  protected p: number;

  constructor(n = 10, p = 0.5) {
    const validN = Math.max(1, Math.floor(Number(n)));
    const validP = Math.min(1, Math.max(0, Number(p)));

    super('Binomial (การแจกแจงทวิภาค)', {
      n: validN,
      p: validP
    });

    this.n = validN;
    this.p = validP;
  }

  combination(n, k) {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    let coeff = 1;
    for (let i = 1; i <= k; i++) {
      coeff = coeff * (n - i + 1) / i;
    }
    return coeff;
  }

  calculatePDF(k) {
    const kInt = Math.round(k);
    if (kInt < 0 || kInt > this.n) return 0;
    const nCk = this.combination(this.n, kInt);
    return nCk * Math.pow(this.p, kInt) * Math.pow(1 - this.p, this.n - kInt);
  }

  calculateProbability(k1, k2 = null) {
    if (k2 === null) {
      const pmf = this.calculatePDF(k1);
      return { prob: pmf, expression: `P(X = ${k1}) = ${pmf.toFixed(4)}` };
    } else {
      let cumulative = 0;
      for (let i = Math.min(k1, k2); i <= Math.max(k1, k2); i++) {
        cumulative += this.calculatePDF(i);
      }
      return { prob: cumulative, expression: `P(${k1} ≤ X ≤ ${k2}) = ${cumulative.toFixed(4)}` };
    }
  }

  getSummaryStats() {
    const mean = this.n * this.p;
    const variance = this.n * this.p * (1 - this.p);
    return {
      mean,
      variance,
      stdDev: Math.sqrt(variance),
      skewness: (1 - 2 * this.p) / Math.sqrt(variance || 1)
    };
  }

  formatFormula() {
    return "P(X = k) = (n! / (k!(n-k)!)) · p^k · (1-p)^(n-k)";
  }
}

/**
 * CONCRETE CLASS 3: PoissonDistribution
 */
class PoissonDistribution extends Distribution {
  protected lambda: number;

  constructor(lambda = 3) {
    const validLambda = Math.max(0.1, Number(lambda));

    super('Poisson (การแจกแจงพัวซอง)', {
      lambda: validLambda
    });

    this.lambda = validLambda;
  }

  factorial(n) {
    if (n <= 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  }

  calculatePDF(k) {
    const kInt = Math.round(k);
    if (kInt < 0) return 0;
    return (Math.pow(this.lambda, kInt) * Math.exp(-this.lambda)) / this.factorial(kInt);
  }

  calculateProbability(k1, k2 = null) {
    if (k2 === null) {
      const prob = this.calculatePDF(k1);
      return { prob, expression: `P(X = ${k1}) = ${prob.toFixed(4)}` };
    } else {
      let cumulative = 0;
      for (let i = Math.min(k1, k2); i <= Math.max(k1, k2); i++) {
        cumulative += this.calculatePDF(i);
      }
      return { prob: cumulative, expression: `P(${k1} ≤ X ≤ ${k2}) = ${cumulative.toFixed(4)}` };
    }
  }

  getSummaryStats() {
    return {
      mean: this.lambda,
      variance: this.lambda,
      stdDev: Math.sqrt(this.lambda),
      skewness: 1 / Math.sqrt(this.lambda)
    };
  }

  formatFormula() {
    return "P(X = k) = (λ^k · e^(-λ)) / k!";
  }
}

/**
 * CONCRETE CLASS 4: LinearRegressionModel (Inherits Distribution / StatisticalModel)
 * Demonstrates Composition via holding a Dataset instance
 */
class LinearRegressionModel extends Distribution {
  declare protected dataset: Dataset;

  protected slope: number = 0;
  protected intercept: number = 0;
  protected rSquared: number = 0;

  constructor(dataset = new Dataset()) {
    super('Linear Regression (การถดถอยเชิงเส้น)', {}, dataset);
    this.calculateRegression();
  }

  calculateRegression() {
    if (!this.dataset || this.dataset.count < 2) {
      this.slope = 0;
      this.intercept = 0;
      this.rSquared = 0;
      return;
    }

    const varX = this.dataset.varianceX;
    const cov = this.dataset.covariance;

    this.slope = varX !== 0 ? cov / varX : 0;
    this.intercept = this.dataset.meanY - this.slope * this.dataset.meanX;

    // R-squared
    const my = this.dataset.meanY;
    const ssTot = this.dataset.getPoints().reduce((sum, p) => sum + Math.pow(p.getY() - my, 2), 0);
    const ssRes = this.dataset.getPoints().reduce((sum, p) => sum + Math.pow(p.getY() - (this.slope * p.getX() + this.intercept), 2), 0);
    this.rSquared = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;
  }

  calculatePDF(x) {
    // Returns predicted y = mx + c
    return this.slope * x + this.intercept;
  }

  calculateProbability(x) {
    const yPred = this.calculatePDF(x);
    return {
      prob: yPred,
      expression: `Ŷ(${x}) = ${this.slope.toFixed(3)}(${x}) + ${this.intercept.toFixed(3)} = ${yPred.toFixed(3)}`
    };
  }

  getSummaryStats() {
    return {
      mean: this.dataset.meanY,
      variance: this.dataset.covariance,
      slope: this.slope,
      intercept: this.intercept,
      rSquared: this.rSquared,
      sampleSize: this.dataset.count
    };
  }

  formatFormula() {
    return `Ŷ = ${this.slope.toFixed(2)}X + ${this.intercept >= 0 ? '+' : ''}${this.intercept.toFixed(2)}`;
  }
}

/**
 * POLYMORPHIC SOLVER FUNCTION
 * Accepts any object derived from 'Distribution' and executes uniform calls
 */
function solveDistributionPolymorphically(distObj, val1, val2 = null) {
  return {
    className: distObj.getClassName(),
    summary: distObj.getSummaryStats(),
    probability: distObj.calculateProbability(val1, val2),
    formula: distObj.formatFormula()
  };
}

// ============================================================================
// 2. MAIN APPLICATION REACT COMPONENT
// ============================================================================

export default function App() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('calc'); // 'calc', 'analytics'

  // Current Selected Distribution Category
  const [distType, setDistType] = useState('normal'); // 'normal', 'binomial', 'poisson', 'regression'

  // Input States
  const [normalMean, setNormalMean] = useState(0);
  const [normalStd, setNormalStd] = useState(1);
  const [normalX1, setNormalX1] = useState(-1);
  const [normalX2, setNormalX2] = useState(1);
  const [normalMode, setNormalMode] = useState('bounded'); // 'single' or 'bounded'

  const [binomN, setBinomN] = useState(10);
  const [binomP, setBinomP] = useState(0.5);
  const [binomK1, setBinomK1] = useState(3);
  const [binomK2, setBinomK2] = useState(6);
  const [binomMode, setBinomMode] = useState('range'); // 'single' or 'range'

  const [poissonLambda, setPoissonLambda] = useState(3.5);
  const [poissonK1, setPoissonK1] = useState(2);
  const [poissonK2, setPoissonK2] = useState(5);
  const [poissonMode, setPoissonMode] = useState('range');

  // Regression Points
  const [regPoints, setRegPoints] = useState([
    { x: 1, y: 2.1 },
    { x: 2, y: 3.9 },
    { x: 3, y: 6.1 },
    { x: 4, y: 8.2 },
    { x: 5, y: 9.8 }
  ]);
  const [newPointX, setNewPointX] = useState('');
  const [newPointY, setNewPointY] = useState('');
  const [predictX, setPredictX] = useState(6);

  // User and database state are loaded from the backend API.
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginName, setLoginName] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginPassword, setLoginPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [dbProblems, setDbProblems] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState<any>(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

  const loadProblems = async () => {
    setDbLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/problems`);
      if (!response.ok) throw new Error('โหลดข้อมูลจากฐานข้อมูลไม่สำเร็จ');
      setDbProblems(await response.json());
      setDbError('');
    } catch (error) {
      setDbError(error.message || 'เชื่อมต่อ API ไม่ได้');
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    loadProblems();
    fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' })
      .then(async response => response.ok ? response.json() : null)
      .then(data => setCurrentUser(data?.user ? { ...data.user, isLoggedIn: true } : null))
      .catch(() => setCurrentUser(null));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    } finally {
      setCurrentUser(null);
      showToast('ออกจากระบบแล้ว');
    }
  };

  // Instantiate Active OOP Object dynamically
  const activeDistributionObject = useMemo(() => {
    if (distType === 'normal') {
      return new NormalDistribution(normalMean, normalStd);
    } else if (distType === 'binomial') {
      return new BinomialDistribution(binomN, binomP);
    } else if (distType === 'poisson') {
      return new PoissonDistribution(poissonLambda);
    } else if (distType === 'regression') {
      const ds = new Dataset(regPoints);
      return new LinearRegressionModel(ds);
    }
    return new NormalDistribution(0, 1);
  }, [distType, normalMean, normalStd, binomN, binomP, poissonLambda, regPoints]);

  // Polymorphic execution
  const activeSolveResult = useMemo(() => {
    if (distType === 'normal') {
      return solveDistributionPolymorphically(
        activeDistributionObject,
        normalX1,
        normalMode === 'bounded' ? normalX2 : null
      );
    } else if (distType === 'binomial') {
      return solveDistributionPolymorphically(
        activeDistributionObject,
        binomK1,
        binomMode === 'range' ? binomK2 : null
      );
    } else if (distType === 'poisson') {
      return solveDistributionPolymorphically(
        activeDistributionObject,
        poissonK1,
        poissonMode === 'range' ? poissonK2 : null
      );
    } else if (distType === 'regression') {
      return solveDistributionPolymorphically(
        activeDistributionObject,
        predictX
      );
    }
  }, [activeDistributionObject, distType, normalX1, normalX2, normalMode, binomK1, binomK2, binomMode, poissonK1, poissonK2, poissonMode, predictX]);

  // Toast Notification
  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Calculate and persist the result through the backend API.
  const handleExecuteSolve = async () => {
    if (!currentUser) {
      setAuthMode('login');
      setAuthError('กรุณาเข้าสู่ระบบก่อนบันทึกผลการคำนวณ');
      setShowAuthModal(true);
      return;
    }

    const startedAt = performance.now();
    let inputParams = {};
    let fingerprint = '';

    if (distType === 'normal') {
      inputParams = { mean: normalMean, stdDev: normalStd, mode: normalMode, x1: normalX1, x2: normalX2 };
      fingerprint = `NORMAL_${normalMean}_${normalStd}_${normalMode}_${normalX1}_${normalX2}`;
    } else if (distType === 'binomial') {
      inputParams = { n: binomN, p: binomP, mode: binomMode, k1: binomK1, k2: binomK2 };
      fingerprint = `BINOM_${binomN}_${binomP}_${binomMode}_${binomK1}_${binomK2}`;
    } else if (distType === 'poisson') {
      inputParams = { lambda: poissonLambda, mode: poissonMode, k1: poissonK1, k2: poissonK2 };
      fingerprint = `POISSON_${poissonLambda}_${poissonMode}_${poissonK1}_${poissonK2}`;
    } else {
      inputParams = { sampleCount: regPoints.length, predictX, points: regPoints };
      fingerprint = `REG_${regPoints.length}_${predictX}_${regPoints.map(p => `${p.x},${p.y}`).join(';')}`;
    }

    const payload = {
      fingerprint,
      userId: currentUser?.id || '',
      userName: currentUser?.name || 'Guest',
      distributionType: activeDistributionObject.getType(),
      inputParams,
      outputResult: {
        prob: activeSolveResult.probability.prob,
        detail: activeSolveResult.probability.expression
      },
      executionTimeMs: Number((performance.now() - startedAt).toFixed(2))
    };

    try {
      const response = await fetch(`${API_BASE}/api/problems`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (response.status === 401) {
        // Expired or invalid JWT: clear stale UI state and prompt for a fresh login.
        setCurrentUser(null);
        setAuthMode('login');
        setAuthError('เซสชันหมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบอีกครั้ง');
        setLoginPassword('');
        setShowAuthModal(true);
        return;
      }
      if (!response.ok) throw new Error(result.error || 'บันทึกข้อมูลไม่สำเร็จ');
      await loadProblems();
      showToast(result.message || `บันทึกข้อมูลสำเร็จ: ${result.problemId}`);
    } catch (error) {
      showToast(`บันทึกไม่สำเร็จ: ${error.message}`);
    }
  };

  // Add DataPoint to Regression
  const handleAddPoint = () => {
    if (newPointX === '' || newPointY === '') return;
    setRegPoints([...regPoints, { x: Number(newPointX), y: Number(newPointY) }]);
    setNewPointX('');
    setNewPointY('');
  };

  const handleRemovePoint = (index) => {
    setRegPoints(regPoints.filter((_, i) => i !== index));
  };

  // Authenticated login / registration through secure HTTP-only session cookie.
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (authMode === 'register' && loginPassword !== confirmPassword) {
      setAuthError('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }
    setAuthLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/${authMode}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword, ...(authMode === 'register' ? { name: loginName.trim() } : {}) })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ไม่สามารถดำเนินการได้');
      setCurrentUser({ ...result.user, isLoggedIn: true });
      setShowAuthModal(false);
      setLoginPassword('');
      setConfirmPassword('');
      showToast(authMode === 'register' ? 'สมัครสมาชิกสำเร็จ' : 'เข้าสู่ระบบสำเร็จ');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
    } finally {
      setAuthLoading(false);
    }
  };

  // Canvas Plotter Ref
  const canvasRef = useRef(null);

  // Canvas Drawing Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.parentElement.clientWidth;
    const height = canvas.height = 360;

    ctx.clearRect(0, 0, width, height);

    // Dark Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    if (distType === 'normal') {
      // DRAW NORMAL CURVE
      const mean = normalMean;
      const std = normalStd;
      const xMin = mean - 4 * std;
      const xMax = mean + 4 * std;

      const toScreenX = (x) => ((x - xMin) / (xMax - xMin)) * (width - 80) + 40;
      const maxPdf = activeDistributionObject.calculatePDF(mean);
      const toScreenY = (y) => height - 40 - (y / maxPdf) * (height - 80);

      // Shaded Probability Area
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.beginPath();
      ctx.moveTo(toScreenX(normalX1), height - 40);

      const step = (xMax - xMin) / 200;
      let startX = normalX1;
      let endX = normalMode === 'bounded' ? normalX2 : xMin;

      const fillMin = Math.min(startX, endX);
      const fillMax = Math.max(startX, endX);

      for (let x = fillMin; x <= fillMax; x += step) {
        ctx.lineTo(toScreenX(x), toScreenY(activeDistributionObject.calculatePDF(x)));
      }
      ctx.lineTo(toScreenX(fillMax), height - 40);
      ctx.closePath();
      ctx.fill();

      // Draw Main Curve Line
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = xMin; x <= xMax; x += step) {
        const sx = toScreenX(x);
        const sy = toScreenY(activeDistributionObject.calculatePDF(x));
        if (x === xMin) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      // Baseline & Axes
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, height - 40); ctx.lineTo(width - 30, height - 40);
      ctx.stroke();

      // Mean line
      ctx.strokeStyle = '#d97706';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(toScreenX(mean), 30);
      ctx.lineTo(toScreenX(mean), height - 40);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#d97706';
      ctx.font = '11px monospace';
      ctx.fillText(`μ = ${mean}`, toScreenX(mean) - 15, 20);

    } else if (distType === 'binomial' || distType === 'poisson') {
      // DRAW DISCRETE BAR CHART
      const maxN = distType === 'binomial' ? binomN : Math.min(20, Math.ceil(poissonLambda * 3));
      const barWidth = (width - 100) / (maxN + 1);

      let maxP = 0;
      const probs = [];
      for (let k = 0; k <= maxN; k++) {
        const p = activeDistributionObject.calculatePDF(k);
        probs.push(p);
        if (p > maxP) maxP = p;
      }

      probs.forEach((p, k) => {
        const x = 50 + k * barWidth;
        const barH = (p / (maxP || 1)) * (height - 90);
        const y = height - 40 - barH;

        let isHighlighted = false;
        if (distType === 'binomial') {
          isHighlighted = binomMode === 'range' ? (k >= Math.min(binomK1, binomK2) && k <= Math.max(binomK1, binomK2)) : k === binomK1;
        } else {
          isHighlighted = poissonMode === 'range' ? (k >= Math.min(poissonK1, poissonK2) && k <= Math.max(poissonK1, poissonK2)) : k === poissonK1;
        }

        ctx.fillStyle = isHighlighted ? 'rgba(14, 165, 233, 0.78)' : 'rgba(203, 213, 225, 0.60)';
        ctx.strokeStyle = isHighlighted ? '#0284c7' : '#475569';
        ctx.lineWidth = 1.5;

        ctx.fillRect(x + 2, y, barWidth - 4, barH);
        ctx.strokeRect(x + 2, y, barWidth - 4, barH);

        // Labels
        ctx.fillStyle = '#64748b';
        ctx.font = '10px monospace';
        ctx.fillText(`${k}`, x + barWidth / 2 - 4, height - 20);
      });

      // Axis
      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(40, height - 40); ctx.lineTo(width - 40, height - 40);
      ctx.stroke();

    } else if (distType === 'regression') {
      // DRAW SCATTER PLOT & TRENDLINE
      const points = regPoints;
      if (points.length === 0) return;

      const xs = points.map(p => p.x);
      const ys = points.map(p => p.y);
      const xMin = Math.min(...xs, 0) - 1;
      const xMax = Math.max(...xs, predictX) + 1;
      const yMin = Math.min(...ys, 0) - 2;
      const yMax = Math.max(...ys, activeDistributionObject.calculatePDF(xMax)) + 2;

      const toSX = (x) => ((x - xMin) / (xMax - xMin)) * (width - 100) + 50;
      const toSY = (y) => height - 50 - ((y - yMin) / (yMax - yMin)) * (height - 100);

      // Axes
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, height - 40); ctx.lineTo(width - 40, height - 40);
      ctx.moveTo(50, 20); ctx.lineTo(50, height - 30);
      ctx.stroke();

      // Trendline
      ctx.strokeStyle = '#059669'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(toSX(xMin), toSY(activeDistributionObject.calculatePDF(xMin)));
      ctx.lineTo(toSX(xMax), toSY(activeDistributionObject.calculatePDF(xMax)));
      ctx.stroke();

      // Scatter Points
      points.forEach(p => {
        const sx = toSX(p.x);
        const sy = toSY(p.y);
        ctx.fillStyle = '#0284c7';
        ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke();
      });

      // Predicted Point
      const predY = activeDistributionObject.calculatePDF(predictX);
      const px = toSX(predictX);
      const py = toSY(predY);
      ctx.fillStyle = '#d97706';
      ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
    }
  }, [distType, normalMean, normalStd, normalX1, normalX2, normalMode, binomN, binomP, binomK1, binomK2, binomMode, poissonLambda, poissonK1, poissonK2, poissonMode, regPoints, predictX, activeDistributionObject]);

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-900 font-sans flex flex-col selection:bg-sky-100 selection:text-sky-900">

      {/* HEADER NAVBAR */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-xl sticky top-0 z-40 px-6 lg:px-10 py-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-sky-600 p-2.5 rounded-2xl shadow-sm">
            <BarChart2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-sky-700 via-sky-600 to-indigo-700 bg-clip-text text-transparent">
              StatixViz: Probability & Statistics Suite
            </h1>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
              <span>Statistics & Data Visualization</span> 
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex bg-slate-100/80 p-1 rounded-2xl border border-slate-200/70">
          <button
            onClick={() => setActiveTab('calc')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'calc'
                ? 'bg-white text-sky-700 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white'
            }`}
          >
            <Calculator className="w-4 h-4" />
            เครื่องมือคำนวณสถิติ
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'bg-white text-teal-700 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white'
            }`}
          >
            <Database className="w-4 h-4" />
            MongoDB & Analytics
          </button>
        </nav>

        {/* User Badge */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-1.5 pl-3 rounded-xl">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-700">{currentUser?.name || 'Guest'}</p>
                <p className="text-[10px] text-sky-600 font-mono">ID: {currentUser?.id || ''}</p>
              </div>
              <img src={currentUser.avatar || "https://ui-avatars.com/api/?background=0e7490&color=fff&name=User"} alt="User Avatar" className="w-8 h-8 rounded-lg object-cover ring-2 ring-sky-200" />
              <button
                onClick={handleLogout}
                title="ออกจากระบบ"
                className="p-1.5 hover:bg-rose-500/10 hover:text-rose-400 text-slate-500 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition shadow-sm shadow-sky-100"
            >
              <LogIn className="w-4 h-4" />
              เข้าสู่ระบบ / สมัครสมาชิก
            </button>
          )}
        </div>
      </header>

      {/* Toast Notification Banner */}
      {notification && (
        <div className="bg-emerald-500 text-white font-extrabold px-4 py-2 text-xs text-center flex items-center justify-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          {notification}
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 px-4 py-7 sm:px-6 lg:px-10 lg:py-10 max-w-[1440px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7">

        {/* TAB 1: STATISTICAL CALCULATOR & GRAPH */}
        {activeTab === 'calc' && (
          <>
            <div className="lg:col-span-12 mb-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-[11px] font-semibold text-sky-700 mb-3"><Sparkles className="w-3.5 h-3.5" /> STATISTICS WORKSPACE</div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">คำนวณสถิติอย่างเป็นระบบ</h2>
              <p className="text-sm text-slate-500 mt-2 max-w-2xl">เลือกประเภทการแจกแจง ปรับค่าพารามิเตอร์ และดูผลลัพธ์พร้อมกราฟได้ในที่เดียว</p>
            </div>
            {/* LEFT PANEL: SELECTOR & CONTROLS */}
            <div className="lg:col-span-7 flex flex-col gap-6">

              {/* Distribution Selector Bar */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-wrap gap-2">
                {[
                  { id: 'normal', label: 'Normal (โค้งปกติ Z)', icon: Activity },
                  { id: 'binomial', label: 'Binomial (ทวิภาค)', icon: BarChart2 },
                  { id: 'poisson', label: 'Poisson (พัวซอง)', icon: TrendingUp },
                  { id: 'regression', label: 'Linear Regression', icon: Sliders }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setDistType(item.id)}
                    className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
                      distType === item.id
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-100'
                        : 'bg-slate-50 text-slate-500 border border-slate-200 hover:text-slate-800'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Input Parameters Controls */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-sky-600" />
                    ปรับพารามิเตอร์โจทย์ ({activeDistributionObject.getType()})
                  </h3>
                  <span className="text-[10px] font-mono text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                    Class: {activeDistributionObject.getClassName()}
                  </span>
                </div>

                {/* Normal Distribution Inputs */}
                {distType === 'normal' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">ค่าเฉลี่ย (Mean μ):</label>
                      <input
                        type="number" value={normalMean} onChange={e => setNormalMean(Number(e.target.value))}
                        className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2.5 text-sky-700 outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">ส่วนเบี่ยงเบนมาตรฐาน (Std Dev σ):</label>
                      <input
                        type="number" min="0.1" step="0.1" value={normalStd} onChange={e => setNormalStd(Number(e.target.value))}
                        className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2.5 text-sky-700 outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 font-mono"
                      />
                    </div>
                    <div className="md:col-span-2 flex items-center gap-4 pt-2">
                      <span className="text-slate-500 font-bold">โหมดหาความน่าจะเป็น:</span>
                      <button onClick={() => setNormalMode('single')} className={`px-3 py-1 rounded-lg text-xs font-bold ${normalMode === 'single' ? 'bg-sky-600 text-white' : 'bg-slate-50 text-slate-500'}`}>P(X ≤ x1)</button>
                      <button onClick={() => setNormalMode('bounded')} className={`px-3 py-1 rounded-lg text-xs font-bold ${normalMode === 'bounded' ? 'bg-sky-600 text-white' : 'bg-slate-50 text-slate-500'}`}>P(x1 ≤ X ≤ x2)</button>
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">ขอบเขต x1:</label>
                      <input type="number" step="0.5" value={normalX1} onChange={e => setNormalX1(Number(e.target.value))} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2.5 text-sky-700 outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 font-mono" />
                    </div>
                    {normalMode === 'bounded' && (
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">ขอบเขต x2:</label>
                        <input type="number" step="0.5" value={normalX2} onChange={e => setNormalX2(Number(e.target.value))} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2.5 text-sky-700 outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 font-mono" />
                      </div>
                    )}
                  </div>
                )}

                {/* Binomial Distribution Inputs */}
                {distType === 'binomial' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">จำนวนการทดลอง (n):</label>
                      <input type="number" min="1" max="50" value={binomN} onChange={e => setBinomN(Number(e.target.value))} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2.5 text-sky-700 outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 font-mono" />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">ความน่าจะเป็นสำเร็จ (p):</label>
                      <input type="number" min="0" max="1" step="0.05" value={binomP} onChange={e => setBinomP(Number(e.target.value))} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2.5 text-sky-700 outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 font-mono" />
                    </div>
                    <div className="md:col-span-2 flex items-center gap-4 pt-2">
                      <span className="text-slate-500 font-bold">โหมดหาความน่าจะเป็น:</span>
                      <button onClick={() => setBinomMode('single')} className={`px-3 py-1 rounded-lg text-xs font-bold ${binomMode === 'single' ? 'bg-sky-600 text-white' : 'bg-slate-50 text-slate-500'}`}>P(X = k)</button>
                      <button onClick={() => setBinomMode('range')} className={`px-3 py-1 rounded-lg text-xs font-bold ${binomMode === 'range' ? 'bg-sky-600 text-white' : 'bg-slate-50 text-slate-500'}`}>P(k1 ≤ X ≤ k2)</button>
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">จำนวน k1:</label>
                      <input type="number" min="0" max={binomN} value={binomK1} onChange={e => setBinomK1(Number(e.target.value))} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2.5 text-sky-700 outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 font-mono" />
                    </div>
                    {binomMode === 'range' && (
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">จำนวน k2:</label>
                        <input type="number" min="0" max={binomN} value={binomK2} onChange={e => setBinomK2(Number(e.target.value))} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2.5 text-sky-700 outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 font-mono" />
                      </div>
                    )}
                  </div>
                )}

                {/* Poisson Distribution Inputs */}
                {distType === 'poisson' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">อัตราเฉลี่ย (Lambda λ):</label>
                      <input type="number" min="0.1" step="0.5" value={poissonLambda} onChange={e => setPoissonLambda(Number(e.target.value))} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2.5 text-sky-700 outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 font-mono" />
                    </div>
                    <div className="flex items-center gap-4 pt-4">
                      <button onClick={() => setPoissonMode('single')} className={`px-3 py-1 rounded-lg text-xs font-bold ${poissonMode === 'single' ? 'bg-sky-600 text-white' : 'bg-slate-50 text-slate-500'}`}>P(X = k)</button>
                      <button onClick={() => setPoissonMode('range')} className={`px-3 py-1 rounded-lg text-xs font-bold ${poissonMode === 'range' ? 'bg-sky-600 text-white' : 'bg-slate-50 text-slate-500'}`}>P(k1 ≤ X ≤ k2)</button>
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">จำนวน k1:</label>
                      <input type="number" min="0" value={poissonK1} onChange={e => setPoissonK1(Number(e.target.value))} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2.5 text-sky-700 outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 font-mono" />
                    </div>
                    {poissonMode === 'range' && (
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">จำนวน k2:</label>
                        <input type="number" min="0" value={poissonK2} onChange={e => setPoissonK2(Number(e.target.value))} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2.5 text-sky-700 outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 font-mono" />
                      </div>
                    )}
                  </div>
                )}

                {/* Linear Regression Inputs */}
                {distType === 'regression' && (
                  <div className="space-y-3 text-xs">
                    <div className="flex gap-2">
                      <input type="number" placeholder="ค่า X" value={newPointX} onChange={e => setNewPointX(e.target.value)} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2.5 text-sky-700 outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 font-mono" />
                      <input type="number" placeholder="ค่า Y" value={newPointY} onChange={e => setNewPointY(e.target.value)} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2.5 text-sky-700 outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 font-mono" />
                      <button onClick={handleAddPoint} className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1">
                        <Plus className="w-4 h-4" /> เพิ่มจุด
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                      {regPoints.map((pt, idx) => (
                        <span key={idx} className="bg-white border border-slate-200 text-sky-700 px-2.5 py-1 rounded-lg flex items-center gap-2 font-mono">
                          ({pt.x}, {pt.y})
                          <button onClick={() => handleRemovePoint(idx)} className="text-rose-400 hover:text-rose-300"><Trash2 className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>

                    <div className="pt-2">
                      <label className="block text-slate-500 font-bold mb-1">ทำนายค่า Y เมื่อ X = :</label>
                      <input type="number" value={predictX} onChange={e => setPredictX(Number(e.target.value))} className="w-36 bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-emerald-600 font-mono font-bold" />
                    </div>
                  </div>
                )}

                {/* SOLVE BUTTON */}
                <button
                  onClick={handleExecuteSolve}
                  className="w-full py-3 bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 font-extrabold text-white rounded-xl shadow-sm shadow-sky-100 hover:brightness-110 transition flex items-center justify-center gap-2 text-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  คำนวณ
                </button>
              </div>

              {/* Interactive Canvas Graph */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xl flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-sky-600" />
                    กราฟแสดงผลจำลอง (Dynamic Visualizer Canvas)
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded">Interactive Render</span>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <canvas ref={canvasRef} className="w-full h-[360px] block" />
                </div>
              </div>

            </div>

            {/* RIGHT PANEL: POLYMORPHIC SOLVER OUTPUT & FORMULAS */}
            <div className="lg:col-span-5 flex flex-col gap-6">

              {/* Solution Summary Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-sky-600" />
                    ผลลัพธ์คำนวณ (Polymorphic Solver)
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Live Computed
                  </span>
                </div>

                {/* Primary Result Box */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <p className="text-xs text-slate-500 font-semibold">สมการความน่าจะเป็น / ผลลัพธ์:</p>
                  <p className="text-lg font-mono font-extrabold text-sky-700 bg-slate-50 px-3 py-2 rounded-lg border border-sky-200">
                    {activeSolveResult.probability.expression}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    สูตรคณิตศาสตร์: <span className="text-amber-600 font-mono font-bold">{activeSolveResult.formula}</span>
                  </p>
                </div>

                {/* Summary Statistics Breakdown */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">ค่าทางสถิติที่สำคัญ (Summary Statistics):</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">ค่าเฉลี่ย (Mean μ / Ŷ)</p>
                      <p className="text-sm font-bold font-mono text-sky-600">{activeSolveResult.summary.mean?.toFixed(4) || 0}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">ความแปรปรวน (Variance σ²)</p>
                      <p className="text-sm font-bold font-mono text-violet-600">{activeSolveResult.summary.variance?.toFixed(4) || 0}</p>
                    </div>
                    {activeSolveResult.summary.stdDev !== undefined && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <p className="text-[10px] text-slate-500 font-bold uppercase">ส่วนเบี่ยงเบน (Std Dev σ)</p>
                        <p className="text-sm font-bold font-mono text-amber-600">{activeSolveResult.summary.stdDev?.toFixed(4)}</p>
                      </div>
                    )}
                    {activeSolveResult.summary.rSquared !== undefined && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <p className="text-[10px] text-slate-500 font-bold uppercase">สัมประสิทธิ์ตัดสินใจ (R²)</p>
                        <p className="text-sm font-bold font-mono text-emerald-600">{(activeSolveResult.summary.rSquared * 100).toFixed(2)}%</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Theory Reference Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-sky-600" />
                  คำอธิบายทฤษฎี (Theoretical Concept)
                </h3>
                <div className="text-xs text-slate-500 leading-relaxed space-y-2">
                  {distType === 'normal' && (
                    <p>การแจกแจงแบบปกติ (Normal Distribution) มีรูปร่างโค้งระนาบระฆังคว่ำแบบสมมาตรโดยมีค่าเฉลี่ย μ เป็นจุดศูนย์กลาง พื้นที่ใต้โค้งทั้งหมดมีค่าเท่ากับ 1.0 (100%) ใช้ Z-score ในการแปลงค่าข้อมูลไปสู่มาตรฐานมาตรฐาน</p>
                  )}
                  {distType === 'binomial' && (
                    <p>การแจกแจงทวิภาค (Binomial Distribution) ใช้คำนวณความน่าจะเป็นของการเกิดเหตุการณ์สำเร็จ k ครั้ง จากการทดลอง n ครั้งที่เป็นอิสระต่อกัน โดยแต่ละครั้งมีโอกาสสำเร็จเท่ากับ p</p>
                  )}
                  {distType === 'poisson' && (
                    <p>การแจกแจงพัวซอง (Poisson Distribution) ใช้คำนวณจำนวนครั้งของเหตุการณ์ที่สนใจซึ่งเกิดขึ้นในช่วงเวลาหรือพื้นที่ขนาดคงที่ โดยมีอัตราการเกิดเฉลี่ยเท่ากับ λ</p>
                  )}
                  {distType === 'regression' && (
                    <p>การถดถอยเชิงเส้น (Linear Regression) ใช้สร้างแบบจำลองความสัมพันธ์ระหว่างตัวแปรอิสระ X และตัวแปรตาม Y ในรูปสมการเส้นตรง Ŷ = mX + c โดยใช้ค่าน้อยที่สุดของผลรวมกำลังสอง</p>
                  )}
                </div>
              </div>

            </div>
          </>
        )}

        {/* TAB 2: MONGODB DATABASE & ANALYTICS LEADERBOARD */}
        {activeTab === 'analytics' && (
          <div className="lg:col-span-12 space-y-6">

            {/* Metrics Overview Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center gap-4">
                <div className="p-3 bg-sky-600/10 rounded-xl text-sky-600 border border-sky-200">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">โจทย์ที่ถูกคำนวณทั้งหมด</p>
                  <p className="text-xl font-extrabold text-slate-900 font-mono">{dbProblems.reduce((sum, p) => sum + p.solvedCount, 0)} ครั้ง</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center gap-4">
                <div className="p-3 bg-violet-50 rounded-xl text-violet-600 border border-violet-200">
                  <ListOrdered className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">จำนวนโจทย์ซ้ำใน DB</p>
                  <p className="text-xl font-extrabold text-slate-900 font-mono">{dbProblems.length} Unique IDs</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-500/20">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">จำนวนยอดเข้าดูรวม (Views)</p>
                  <p className="text-xl font-extrabold text-slate-900 font-mono">{dbProblems.reduce((sum, p) => sum + p.viewCount, 0)} Views</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center gap-4">
                <div className="p-3 bg-amber-50 rounded-xl text-amber-600 border border-amber-500/20">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">ผู้ใช้งานระบบปัจจุบัน</p>
                  <p className="text-sm font-bold text-slate-900 truncate">{currentUser?.name || 'Guest'}</p>
                </div>
              </div>
            </div>

            {/* MongoDB Records Table */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-200 pb-4 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">MongoDB Collection</span>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mt-1">
                    <Database className="w-5 h-5 text-emerald-600" />
                    ตารางบันทึกโจทย์สถิติและความถี่การใช้งาน (Problem Usage Frequency)
                  </h2>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-mono rounded-full font-bold">
                  API Connected
                </span>
              </div>

              {dbError && <p className="text-sm text-rose-400">Database API: {dbError}. ตรวจสอบว่า backend และ MongoDB ทำงานอยู่</p>}
              {dbLoading && <p className="text-xs text-sky-600">กำลังโหลดข้อมูลจากฐานข้อมูล...</p>}
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                      <th className="p-3">Problem ID</th>
                      <th className="p-3">ผู้บันทึก (User)</th>
                      <th className="p-3">ประเภทการแจกแจง</th>
                      <th className="p-3">ผลลัพธ์ (Result)</th>
                      <th className="p-3 text-center">จำนวนที่ถูกคำนวณ (Solved Count)</th>
                      <th className="p-3 text-center">ยอดดู (Views)</th>
                      <th className="p-3">เวลาประมวลผล</th>
                      <th className="p-3">วันที่สร้าง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {[...dbProblems].sort((a, b) => b.solvedCount - a.solvedCount).map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50 transition">
                        <td className="p-3">
                          <button type="button" onClick={() => setSelectedProblem(rec)}
                            className="inline-flex items-center gap-1.5 text-emerald-700 font-bold hover:text-sky-700 hover:underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded"
                            title={`ดูรายละเอียดการคำนวณ ${rec.problemId}`}>
                            <Flame className="w-3.5 h-3.5 text-amber-500" />
                            {rec.problemId}
                            <Eye className="w-3.5 h-3.5 ml-1 opacity-70" />
                          </button>
                        </td>
                        <td className="p-3 text-slate-700 font-sans">{rec.userName}</td>
                        <td className="p-3 text-sky-700 font-bold">{rec.distributionType}</td>
                        <td className="p-3 text-slate-700">{rec.outputResult?.detail}</td>
                        <td className="p-3 text-center">
                          <span className="bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-full font-bold">
                            {rec.solvedCount} ครั้ง
                          </span>
                        </td>
                        <td className="p-3 text-center text-slate-500">{rec.viewCount}</td>
                        <td className="p-3 text-slate-500">{rec.executionTimeMs} ms</td>
                        <td className="p-3 text-slate-500 text-[11px] font-sans">{rec.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* SAVED CALCULATION DETAIL MODAL: reads the existing MongoDB record in dbProblems */}
      {selectedProblem && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm p-4 flex items-center justify-center"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedProblem(null); }}>
          <div role="dialog" aria-modal="true" aria-label="รายละเอียดการคำนวณ"
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto p-5 sm:p-7 space-y-5">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-sky-600 mb-1">Saved calculation</p>
                <h2 className="text-lg font-extrabold text-slate-900 break-all">{selectedProblem.problemId}</h2>
                <p className="text-sm text-slate-500 mt-1">รายละเอียดการคำนวณที่บันทึกไว้ใน MongoDB</p>
              </div>
              <button type="button" onClick={() => setSelectedProblem(null)}
                className="shrink-0 p-2 rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-sky-400"
                aria-label="ปิดรายละเอียด">✕</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3"><p className="text-xs text-slate-500 mb-1">ประเภทการคำนวณ</p><p className="font-bold text-slate-900">{selectedProblem.distributionType}</p></div>
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3"><p className="text-xs text-slate-500 mb-1">ผู้บันทึก</p><p className="font-bold text-slate-900">{selectedProblem.userName}</p></div>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 mb-2">ค่าพารามิเตอร์ที่ใช้ (Input Parameters)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(selectedProblem.inputParams || {}).map(([key, value]) => (
                  <div key={key} className="bg-slate-50 border border-slate-200 rounded-xl p-3 min-w-0">
                    <p className="text-xs text-slate-500 mb-1">{key}</p>
                    <pre className="text-sm text-slate-800 font-mono whitespace-pre-wrap break-words max-h-36 overflow-auto">{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</pre>
                  </div>
                ))}
                {Object.keys(selectedProblem.inputParams || {}).length === 0 && <p className="text-sm text-slate-500">ไม่มีข้อมูลพารามิเตอร์</p>}
              </div>
            </div>
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 space-y-2">
              <h3 className="font-bold text-sky-900">ผลลัพธ์การคำนวณ (Result)</h3>
              <p className="font-mono text-sm sm:text-base text-sky-800 break-words">{selectedProblem.outputResult?.detail || 'ไม่มีรายละเอียดผลลัพธ์'}</p>
              {selectedProblem.outputResult?.prob !== undefined && <p className="text-sm text-sky-700">ค่าที่บันทึก: <strong>{String(selectedProblem.outputResult.prob)}</strong></p>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div><p className="text-slate-500">คำนวณทั้งหมด</p><p className="font-bold text-slate-900">{selectedProblem.solvedCount} ครั้ง</p></div>
              <div><p className="text-slate-500">จำนวนการดู</p><p className="font-bold text-slate-900">{selectedProblem.viewCount}</p></div>
              <div><p className="text-slate-500">ประมวลผล</p><p className="font-bold text-slate-900">{selectedProblem.executionTimeMs} ms</p></div>
              <div><p className="text-slate-500">วันที่บันทึก</p><p className="font-bold text-slate-900">{selectedProblem.createdAt || '-'}</p></div>
            </div>
            <p className="text-xs text-slate-500">แสดงค่าที่บันทึกไว้ ไม่ได้คำนวณซ้ำ • สูตรทั่วไปไม่ได้บันทึกในรายการย้อนหลัง</p>
            <button type="button" onClick={() => setSelectedProblem(null)} className="w-full rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold py-3">ปิดหน้าต่าง</button>
          </div>
        </div>
      )}

      {/* AUTHENTICATION MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/35 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-sky-600" />
                เข้าสู่ระบบ / สมัครสมาชิก
              </h3>
              <button onClick={() => setShowAuthModal(false)} className="text-slate-500 hover:text-slate-800 text-sm">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              {(['login', 'register'] as const).map(mode => (
                <button key={mode} type="button" onClick={() => { setAuthMode(mode); setAuthError(''); }}
                  className={`py-2 rounded-lg font-bold ${authMode === mode ? 'bg-sky-600 text-white' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                  {mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
                </button>
              ))}
            </div>
            <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
              {authMode === 'register' && <div>
                <label className="block text-slate-700 font-bold mb-1">ชื่อผู้ใช้</label>
                <input type="text" required maxLength={100} autoComplete="name" value={loginName} onChange={e => setLoginName(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400" />
              </div>}
              <div>
                <label className="block text-slate-700 font-bold mb-1">อีเมล (Email)</label>
                <input type="email" required autoComplete="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400" />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)</label>
                <input type="password" required minLength={8} maxLength={128} autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                  value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400" />
              </div>
              {authMode === 'register' && <div>
                <label className="block text-slate-700 font-bold mb-1">ยืนยันรหัสผ่าน</label>
                <input type="password" required minLength={8} maxLength={128} autoComplete="new-password"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400" />
              </div>}
              {authError && <p role="alert" className="text-rose-400">{authError}</p>}
              <button type="submit" disabled={authLoading}
                className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 font-bold text-white rounded-xl shadow-sm hover:brightness-110 transition disabled:opacity-50">
                {authLoading ? 'กำลังดำเนินการ...' : authMode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500 flex flex-wrap justify-between items-center gap-4">
        <div>
          StatixViz Suite &bull; Probability & Statistics (React + MongoDB)
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-500">พัฒนาโดย:</span>
          <span className="font-bold text-slate-700">ณภัทร เอี่ยมพรม 6704062661040</span>
        </div>
      </footer>

    </div>
  );
}