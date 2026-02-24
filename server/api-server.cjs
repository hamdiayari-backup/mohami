/**
 * Admin REST API Server for Mouhami AI
 * Base URL: https://mouhami-ai.tn/api
 */
require('./load-env.cjs');

const express = require('express');
const cors = require('cors');
const { pool, initDB } = require('../services/db.cjs');
const { chatService } = require('../services/chatService.cjs');

const app = express();
const PORT = process.env.API_PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'mouhami-admin-secret-change-in-production';

// JWT (simple implementation without jsonwebtoken - use env var for secret)
function createToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 })).toString('base64url');
  const sign = require('crypto').createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sign}`;
}

function verifyToken(token) {
  if (!token || !token.startsWith('Bearer ')) return null;
  const t = token.slice(7);
  const parts = t.split('.');
  if (parts.length !== 3) return null;
  try {
    const body = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (body.exp && body.exp < Date.now()) return null;
    return body;
  } catch {
    return null;
  }
}

app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));

// Routes - Nginx forwards /api/* to this server as /api/*
const auth = (req, res, next) => {
  const payload = verifyToken(req.headers.authorization);
  if (!payload || payload.role !== 'ADMIN') {
    return res.status(401).json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' });
  }
  req.admin = payload;
  next();
};

// --- LOGIN ---
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const r = await pool.query('SELECT id, email, name, role, password FROM users WHERE email = $1 AND role = $2', [email, 'ADMIN']);
    if (r.rows.length === 0 || r.rows[0].password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = r.rows[0];
    const token = createToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- USERS (auth required) ---
app.get('/api/admin/users', auth, async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT id, email, name, role, subscription_plan, subscription_status, avatar, organization_owner_id FROM users WHERE role != 'ADMIN'"
    );
    const users = r.rows.map(row => ({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      subscriptionPlan: row.subscription_plan,
      subscriptionStatus: row.subscription_status,
      avatar: row.avatar,
      organizationOwnerId: row.organization_owner_id
    }));
    res.json(users);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.patch('/api/admin/users/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, subscriptionPlan } = req.body || {};
    if (!name && !email && !subscriptionPlan) {
      return res.status(400).json({ error: 'At least one field required' });
    }
    const updates = [];
    const params = [];
    let i = 1;
    if (name !== undefined) { updates.push(`name = $${i++}`); params.push(name); }
    if (email !== undefined) { updates.push(`email = $${i++}`); params.push(email); }
    if (subscriptionPlan !== undefined) { updates.push(`subscription_plan = $${i++}`); params.push(subscriptionPlan); }
    params.push(id);
    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${i}`,
      params
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/admin/users/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.patch('/api/admin/users/:id/plan', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { plan } = req.body || {};
    if (!['basic', 'pro', 'enterprise'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }
    await pool.query(
      "UPDATE users SET subscription_plan = $1, subscription_status = 'active' WHERE id = $2",
      [plan, id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Upgrade plan error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- INVOICES ---
app.get('/api/admin/invoices/pending', auth, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT i.id, i.date, i.amount, i.status, i.plan_name, i.receipt_data, u.email as user_email, u.name as user_name
      FROM invoices i
      JOIN users u ON i.user_id = u.id
      WHERE i.status = 'pending'
      ORDER BY i.date ASC
    `);
    const invoices = r.rows.map(row => ({
      id: row.id,
      date: row.date,
      amount: parseFloat(row.amount),
      status: row.status,
      planName: row.plan_name,
      receiptData: row.receipt_data,
      userEmail: row.user_email,
      userName: row.user_name
    }));
    res.json(invoices);
  } catch (err) {
    console.error('Get pending invoices error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/invoices/:id/approve', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const inv = await pool.query('SELECT * FROM invoices WHERE id = $1', [id]);
    if (inv.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
    const invoice = inv.rows[0];
    await pool.query("UPDATE invoices SET status = 'paid' WHERE id = $1", [id]);
    await pool.query(
      "UPDATE users SET subscription_plan = $1, subscription_status = 'active' WHERE id = $2",
      [invoice.plan_name, invoice.user_id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Approve invoice error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/invoices/:id/reject', auth, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE invoices SET status = 'rejected' WHERE id = $1", [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Reject invoice error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- STATS ---
app.get('/api/admin/stats', auth, async (req, res) => {
  try {
    const usersR = await pool.query("SELECT COUNT(*) as c FROM users WHERE role != 'ADMIN'");
    const lawyersR = await pool.query("SELECT COUNT(*) as c FROM users WHERE role = 'LAWYER'");
    const pendingR = await pool.query("SELECT COUNT(*) as c FROM invoices WHERE status = 'pending'");
    const totalVisitsR = await pool.query('SELECT COUNT(*) as count FROM platform_visitors');
    const uniqueR = await pool.query('SELECT COUNT(DISTINCT session_id) as count FROM platform_visitors');
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    const weekStart = startOfWeek.toISOString().split('T')[0];
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const [todayR, weekR, monthR] = await Promise.all([
      pool.query("SELECT COUNT(*) as count FROM platform_visitors WHERE visit_date >= $1", [`${today} 00:00:00`]),
      pool.query("SELECT COUNT(*) as count FROM platform_visitors WHERE visit_date >= $1", [`${weekStart} 00:00:00`]),
      pool.query("SELECT COUNT(*) as count FROM platform_visitors WHERE visit_date >= $1", [`${monthStart} 00:00:00`])
    ]);
    const [revenueR, monthRevR, newCasesR, planR, contractsR] = await Promise.all([
      pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE status = 'paid'"),
      pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE status = 'paid' AND date >= $1", [monthStart]),
      pool.query("SELECT COUNT(*) as c FROM cases WHERE date_created >= $1", [monthStart]),
      pool.query("SELECT subscription_plan, COUNT(*) as c FROM users WHERE role != 'ADMIN' GROUP BY subscription_plan"),
      pool.query("SELECT COUNT(*) as c FROM contracts")
    ]);
    const planMap = { basic: 0, pro: 0, enterprise: 0 };
    (planR.rows || []).forEach(r => { planMap[r.subscription_plan || 'basic'] = parseInt(r.c) || 0; });

    res.json({
      users: { total: parseInt(usersR.rows[0]?.c || '0'), lawyers: parseInt(lawyersR.rows[0]?.c || '0') },
      pendingInvoices: parseInt(pendingR.rows[0]?.c || '0'),
      visitors: {
        totalVisits: parseInt(totalVisitsR.rows[0]?.count || '0'),
        uniqueVisitors: parseInt(uniqueR.rows[0]?.count || '0'),
        visitsToday: parseInt(todayR.rows[0]?.count || '0'),
        visitsThisWeek: parseInt(weekR.rows[0]?.count || '0'),
        visitsThisMonth: parseInt(monthR.rows[0]?.count || '0')
      },
      advancedStats: {
        revenueTotal: parseFloat(revenueR.rows[0]?.total || '0'),
        revenueThisMonth: parseFloat(monthRevR.rows[0]?.total || '0'),
        newCasesThisMonth: parseInt(newCasesR.rows[0]?.c || '0'),
        totalContracts: parseInt(contractsR.rows[0]?.c || '0'),
        planBreakdown: planMap
      }
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/stats/visitors', auth, async (req, res) => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    const weekStart = startOfWeek.toISOString().split('T')[0];
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const [totalR, uniqueR, todayR, weekR, monthR] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM platform_visitors'),
      pool.query('SELECT COUNT(DISTINCT session_id) as count FROM platform_visitors'),
      pool.query("SELECT COUNT(*) as count FROM platform_visitors WHERE visit_date >= $1", [`${today} 00:00:00`]),
      pool.query("SELECT COUNT(*) as count FROM platform_visitors WHERE visit_date >= $1", [`${weekStart} 00:00:00`]),
      pool.query("SELECT COUNT(*) as count FROM platform_visitors WHERE visit_date >= $1", [`${monthStart} 00:00:00`])
    ]);
    res.json({
      totalVisits: parseInt(totalR.rows[0]?.count || '0'),
      uniqueVisitors: parseInt(uniqueR.rows[0]?.count || '0'),
      visitsToday: parseInt(todayR.rows[0]?.count || '0'),
      visitsThisWeek: parseInt(weekR.rows[0]?.count || '0'),
      visitsThisMonth: parseInt(monthR.rows[0]?.count || '0')
    });
  } catch (err) {
    console.error('Get visitor stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/stats/visits-chart', auth, async (req, res) => {
  try {
    const days = Math.min(90, parseInt(req.query.days) || 14);
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const r = await pool.query(
      "SELECT SUBSTRING(visit_date, 1, 10) as d, COUNT(*) as c FROM platform_visitors WHERE visit_date >= $1 GROUP BY SUBSTRING(visit_date, 1, 10) ORDER BY d",
      [start]
    );
    const map = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      map[d.toISOString().split('T')[0]] = 0;
    }
    (r.rows || []).forEach(row => { map[row.d] = parseInt(row.c || '0'); });
    const result = Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).map(([date, visits]) => ({
      date,
      visits,
      label: new Date(date + 'T12:00:00').toLocaleDateString('ar-TN', { day: 'numeric', month: 'short' })
    }));
    res.json(result);
  } catch (err) {
    console.error('Get visits chart error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/stats/registrations-chart', auth, async (req, res) => {
  try {
    const months = Math.min(24, parseInt(req.query.months) || 6);
    const { rows } = await pool.query("SELECT id, created_at FROM users WHERE role != 'ADMIN'");
    const monthCounts = {};
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[key] = 0;
    }
    (rows || []).forEach(r => {
      const date = r.created_at ? new Date(r.created_at) : new Date(parseInt(r.id) || Date.now());
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthCounts[key] !== undefined) monthCounts[key]++;
    });
    const result = Object.entries(monthCounts).sort((a, b) => a[0].localeCompare(b[0])).map(([month, count]) => ({
      month,
      count,
      label: new Date(month + '-01').toLocaleDateString('ar-TN', { month: 'short', year: 'numeric' })
    }));
    res.json(result);
  } catch (err) {
    console.error('Get registrations chart error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- CHAT ---
const mapConv = (row) => ({
  id: row.id,
  userId: row.user_id,
  userName: row.user_name || (row.user_id ? 'مستخدم متصل' : 'ضيف'),
  userEmail: row.user_email || null,
  status: row.status || 'active',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  lastMessageAt: row.last_message_at
});

const mapMsg = (row) => ({
  id: row.id,
  conversationId: row.conversation_id,
  senderType: row.sender_type,
  senderId: row.sender_id,
  senderName: row.sender_name,
  message: row.message,
  createdAt: row.created_at,
  read: !!row.read,
  attachments: row.attachments ? (typeof row.attachments === 'string' ? JSON.parse(row.attachments) : row.attachments) : []
});

app.get('/api/admin/chat/conversations', auth, async (req, res) => {
  try {
    const rows = await chatService.getAllConversations();
    res.json(rows.map(mapConv));
  } catch (err) {
    console.error('Get conversations error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/chat/conversations/:id', auth, async (req, res) => {
  try {
    const conv = await chatService.getConversationWithMessages(req.params.id);
    res.json({
      ...mapConv(conv),
      messages: (conv.messages || []).map(mapMsg)
    });
  } catch (err) {
    if (err.message === 'Conversation not found') return res.status(404).json({ error: 'Conversation not found' });
    console.error('Get conversation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/chat/conversations/:id/messages', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, attachments = [] } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message required' });
    }
    const admin = req.admin;
    const msg = await chatService.addMessage(
      id,
      'admin',
      admin.id,
      admin.name || 'Admin',
      message.trim(),
      attachments
    );
    res.status(201).json(mapMsg(msg));
  } catch (err) {
    console.error('Add message error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/chat/conversations/:id/close', auth, async (req, res) => {
  try {
    await chatService.closeConversation(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('Close conversation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check (no auth)
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'mouhami-admin-api' }));

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

async function start() {
  try {
    await initDB();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Admin API server running on port ${PORT}`);
      console.log(`   Base path: /api (e.g. POST https://mouhami-ai.tn/api/admin/login)`);
    });
  } catch (err) {
    console.error('❌ Failed to start API server:', err);
    process.exit(1);
  }
}

start();
