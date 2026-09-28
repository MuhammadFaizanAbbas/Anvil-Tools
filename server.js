const express = require('express');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { supabase, supabaseAdmin, isSupabaseEnabled } = require('./lib/supabase');
const { tools, posts, analytics } = require('./data/mockData');
const crypto = require('crypto');

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const siteRoot = __dirname;
const publicDir = path.join(siteRoot, 'public');

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 1000 * 60 * 60 * 8,
};

function parseCookies(req) {
  const cookieHeader = req.headers.cookie || '';
  const parts = cookieHeader.split(';').map((p) => p.trim());
  const obj = {};
  parts.forEach((p) => {
    const idx = p.indexOf('=');
    if (idx > -1) {
      const key = p.slice(0, idx);
      const val = p.slice(idx + 1);
      obj[key] = val;
    }
  });
  return obj;
}

function getTokenFromRequest(req) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  const cookies = req.cookies || parseCookies(req);
  if (cookies.admin_token) return cookies.admin_token;
  return null;
}

async function verifySupabaseToken(token) {
  if (!supabaseAdmin || !token) return null;
  try {
    const resp = await supabaseAdmin.auth.getUser(token);
    return resp && resp.data && resp.data.user ? resp.data.user : null;
  } catch (e) {
    return null;
  }
}

function isLoggedIn(req) {
  // Non-blocking quick check used for redirects; prefer cookie presence for sync checks.
  if (isSupabaseEnabled) {
    const cookies = req.cookies || parseCookies(req);
    return Boolean(cookies.admin_token || cookies.admin_session === 'authenticated');
  }
  return req.cookies && req.cookies.admin_session === 'authenticated';
}

async function requireAdmin(req, res, next) {
  if (isSupabaseEnabled && supabaseAdmin) {
    const token = getTokenFromRequest(req);
    if (!token) return res.status(401).json({ error: 'Missing admin token' });
    const user = await verifySupabaseToken(token);
    if (!user) return res.status(401).json({ error: 'Invalid admin token' });
    req.user = user;
    return next();
  }

  // Fallback demo cookie check
  const cookies = req.cookies || parseCookies(req);
  if (cookies.admin_session === 'authenticated') return next();
  return res.status(401).json({ error: 'Not authenticated' });
}

app.use((req, res, next) => {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.split(';').find((part) => part.trim().startsWith('admin_session='));
  if (match) {
    req.cookies = { admin_session: match.split('=')[1] };
  }
  next();
});

// Serve only the explicit `public/` directory when present to avoid exposing
// repository files. Fall back to repository root in development only.
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
} else {
  console.warn('Warning: public directory not found; serving repository root. Create a `public/` build output for production.');
  app.use(express.static(siteRoot));
}

app.get('/admin/login', (req, res) => {
  if (isLoggedIn(req)) {
    return res.redirect('/admin');
  }
  return res.sendFile(path.join(siteRoot, 'admin-panel', 'login.html'));
});

app.get('/admin', (req, res) => {
  if (!isLoggedIn(req)) {
    return res.redirect('/admin/login');
  }
  return res.sendFile(path.join(siteRoot, 'admin-panel', 'index.html'));
});

app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body || {};
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@yourdomain.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (isSupabaseEnabled && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return res.status(401).json({ error: 'Supabase login failed', message: error.message });
      }

        const token = data?.session?.access_token || null;
        if (token) {
          res.cookie('admin_token', token, { ...cookieOptions, httpOnly: true, secure: true });
        }
        res.cookie('admin_session', 'authenticated', cookieOptions);
      return res.json({ ok: true, user: data.user, source: 'supabase' });
    } catch (error) {
      return res.status(500).json({ error: 'Auth failed', message: error.message });
    }
  }

  if (email === adminEmail && password === adminPassword) {
    res.cookie('admin_session', 'authenticated', cookieOptions);
    return res.json({ ok: true, user: { email }, source: 'demo' });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('admin_session');
  res.clearCookie('admin_token');
  return res.json({ ok: true });
});

app.get('/api/admin/me', async (req, res) => {
  if (isSupabaseEnabled && supabaseAdmin) {
    const token = getTokenFromRequest(req);
    const user = token ? await verifySupabaseToken(token) : null;
    if (!user) return res.status(401).json({ authenticated: false });
    return res.json({ authenticated: true, user });
  }

  if (!isLoggedIn(req)) {
    return res.status(401).json({ authenticated: false });
  }
  return res.json({ authenticated: true, user: { email: process.env.ADMIN_EMAIL || 'admin@yourdomain.com' } });
});

app.get('/api/site/overview', (req, res) => {
  const toolCount = tools.length;
  const postCount = posts.length;
  res.json({
    totalTools: toolCount,
    totalPosts: postCount,
    totalVisitors: analytics.totalVisitors,
    avgSessionTime: analytics.avgSessionTime,
    topSource: analytics.topSource,
    toolBreakdown: analytics.toolBreakdown,
  });
});

app.get('/api/tools', (req, res) => {
  res.json(tools);
});

app.put('/api/tools/:slug', requireAdmin, (req, res) => {
  const { slug } = req.params;
  const target = tools.find((tool) => tool.slug === slug);

  if (!target) {
    return res.status(404).json({ error: 'Tool not found' });
  }

  Object.assign(target, req.body);
  return res.json({ ok: true, tool: target });
});

app.get('/api/posts', (req, res) => {
  res.json(posts);
});

app.post('/api/posts', requireAdmin, (req, res) => {
  const { title, slug, excerpt, status = 'draft' } = req.body || {};

  if (!title || !slug) {
    return res.status(400).json({ error: 'Title and slug are required' });
  }

  const post = {
    id: slug,
    title,
    slug,
    excerpt: excerpt || '',
    status,
    updatedAt: new Date().toISOString().slice(0, 10),
  };

  posts.unshift(post);
  return res.status(201).json({ ok: true, post });
});

app.post('/api/analytics/event', (req, res) => {
  const { tool, category, action } = req.body || {};

  if (!tool) {
    return res.status(400).json({ error: 'Tool is required' });
  }

  const target = tools.find((item) => item.slug === tool || item.name === tool);
  if (target) {
    target.views = Number(target.views || 0) + 1;
  }

  return res.json({ ok: true, message: `Tracked ${action || 'visit'} for ${tool}`, category, tool });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(siteRoot, 'index.html'));
});

// --- Temporary mail proxy (short-lived capability sessions)
// Sessions are persisted in Supabase when configured, otherwise kept in-memory.
const tempMailSessions = new Map();
const TEMP_MAIL_TTL = 1000 * 60 * 60; // 1 hour

// Rate limiting: track create attempts by IP
const rateLimitWindowMs = 1000 * 60 * 60; // 1 hour
const rateLimitMaxAttempts = 5;
const rpLimitTracker = new Map();

function getClientIp(req) {
  return req.headers['x-forwarded-for'] || req.connection.remoteAddress || '0.0.0.0';
}

function checkRateLimit(ip) {
  const now = Date.now();
  if (!rpLimitTracker.has(ip)) {
    rpLimitTracker.set(ip, []);
  }
  const attempts = rpLimitTracker.get(ip);
  const recent = attempts.filter(t => now - t < rateLimitWindowMs);
  rpLimitTracker.set(ip, recent);
  
  if (recent.length >= rateLimitMaxAttempts) {
    return { limited: true, remaining: 0, resetIn: Math.ceil((recent[0] + rateLimitWindowMs - now) / 1000) };
  }
  recent.push(now);
  rpLimitTracker.set(ip, recent);
  return { limited: false, remaining: rateLimitMaxAttempts - recent.length, resetIn: recent[0] ? Math.ceil((recent[0] + rateLimitWindowMs - now) / 1000) : 0 };
}

function makeCapability() {
  return crypto.randomBytes(32).toString('hex');
}

// Cleanup task: delete expired sessions every 10 minutes
function startCleanupTask() {
  const cleanupPeriod = 1000 * 60 * 10;
  setInterval(async () => {
    const now = Date.now();
    let inMemoryCount = 0;
    
    for (const [cap, session] of tempMailSessions.entries()) {
      if (now > session.expiresAt) {
        tempMailSessions.delete(cap);
        inMemoryCount++;
      }
    }
    
    if (inMemoryCount > 0) {
      console.log(`[cleanup] Removed ${inMemoryCount} expired in-memory temp-mail sessions`);
    }
    
    if (isSupabaseEnabled && supabaseAdmin) {
      try {
        await supabaseAdmin.from('temp_mail_sessions').delete().lt('expires_at', new Date().toISOString());
        console.log(`[cleanup] Removed expired temp-mail sessions from Supabase`);
      } catch (err) {
        console.warn(`[cleanup] Error cleaning Supabase sessions:`, err.message);
      }
    }
  }, cleanupPeriod);
}

async function createMailTmAccount(address, password) {
  // Create account
  const createRes = await fetch('https://api.mail.tm/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password }),
  });
  if (!createRes.ok) {
    const txt = await createRes.text();
    throw new Error(`mail.tm account create failed: ${createRes.status} ${txt}`);
  }
  const createData = await createRes.json();

  // Obtain token
  const tokenRes = await fetch('https://api.mail.tm/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password }),
  });
  if (!tokenRes.ok) {
    const txt = await tokenRes.text();
    throw new Error(`mail.tm token failed: ${tokenRes.status} ${txt}`);
  }
  const tokenData = await tokenRes.json();
  return { account: createData, token: tokenData.token };
}

app.post('/api/temp-mail/create', async (req, res) => {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(ip);
    
    if (rateCheck.limited) {
      console.warn(`[rate-limit] IP ${ip} exceeded temp-mail create limit`);
      return res.status(429).json({ 
        error: 'Too many inbox creations', 
        message: `Rate limit exceeded. Try again in ${rateCheck.resetIn}s.`,
        remaining: 0,
        resetIn: rateCheck.resetIn
      });
    }
    
    const domainRes = await fetch('https://api.mail.tm/domains');
    if (!domainRes.ok) throw new Error('mail.tm domain list unavailable');
    const domains = await domainRes.json();
    const domain = domains && domains.length ? domains[0].domain : 'mail.tm';
    const local = crypto.randomBytes(6).toString('hex').slice(0, 8);
    const address = `${local}@${domain}`;
    const password = crypto.randomBytes(16).toString('base64').replace(/[^A-Za-z0-9]/g, 'A');

    const { account, token } = await createMailTmAccount(address, password);
    const cap = makeCapability();
    const expiresAt = Date.now() + TEMP_MAIL_TTL;

    if (isSupabaseEnabled && supabaseAdmin) {
      const { error } = await supabaseAdmin.from('temp_mail_sessions').upsert([{ capability: cap, token, account_id: account.id, address: account.address, expires_at: new Date(expiresAt).toISOString() }]);
      if (error) {
        console.warn('[temp-mail] failed to persist session to Supabase', error.message);
      }
    } else {
      tempMailSessions.set(cap, { token, accountId: account.id, address: account.address, expiresAt });
    }

    console.log(`[temp-mail] Created inbox: ${address} (ttl: 1h, rate: ${rateCheck.remaining} remaining)`);
    return res.json({ ok: true, capability: cap, address: account.address, expiresAt, remaining: rateCheck.remaining });
  } catch (err) {
    console.error('[temp-mail] Create failed:', err.message);
    return res.status(500).json({ error: 'Unable to create temp inbox', message: err.message });
  }
});

function requireTempCapability(req, res, next) {
  const cap = (req.query.cap || req.body.cap || '').trim();
  if (!cap) return res.status(404).json({ error: 'Invalid capability' });
  if (isSupabaseEnabled && supabaseAdmin) {
    (async () => {
      const { data, error } = await supabaseAdmin.from('temp_mail_sessions').select('*').eq('capability', cap).limit(1).single();
      if (error || !data) return res.status(404).json({ error: 'Invalid capability' });
      const expiresAt = new Date(data.expires_at).getTime();
      if (Date.now() > expiresAt) {
        await supabaseAdmin.from('temp_mail_sessions').delete().eq('capability', cap);
        return res.status(410).json({ error: 'Capability expired' });
      }
      req.tempMail = { token: data.token, accountId: data.account_id, address: data.address, expiresAt };
      req.tempCapability = cap;
      return next();
    })();
  } else {
    if (!tempMailSessions.has(cap)) return res.status(404).json({ error: 'Invalid capability' });
    const session = tempMailSessions.get(cap);
    if (Date.now() > session.expiresAt) {
      tempMailSessions.delete(cap);
      return res.status(410).json({ error: 'Capability expired' });
    }
    req.tempMail = session;
    req.tempCapability = cap;
    next();
  }
}

app.get('/api/temp-mail/messages', requireTempCapability, async (req, res) => {
  try {
    const token = req.tempMail.token;
    const msgRes = await fetch('https://api.mail.tm/messages', { headers: { Authorization: `Bearer ${token}` } });
    if (!msgRes.ok) throw new Error('Could not fetch messages from provider');
    const data = await msgRes.json();
    const items = (data['hydra:member'] || data.message || []).map((m) => ({ id: m.id, from: m.from && m.from.address ? m.from.address : m.from, subject: m.subject, intro: m.intro, createdAt: m.createdAt }));
    console.log(`[temp-mail] Listed ${items.length} messages for ${req.tempMail.address}`);
    return res.json({ ok: true, messages: items });
  } catch (err) {
    console.error('[temp-mail] List messages failed:', err.message);
    return res.status(500).json({ error: 'Failed to fetch messages', message: err.message });
  }
});

app.get('/api/temp-mail/messages/:id', requireTempCapability, async (req, res) => {
  try {
    const token = req.tempMail.token;
    const id = req.params.id;
    const msgRes = await fetch(`https://api.mail.tm/messages/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!msgRes.ok) return res.status(404).json({ error: 'Message not found' });
    const msg = await msgRes.json();
    const text = msg.text || (msg.html ? msg.html.replace(/<[^>]+>/g, ' ') : '');
    console.log(`[temp-mail] Fetched message: ${msg.subject} from ${msg.from.address}`);
    return res.json({ ok: true, id: msg.id, from: msg.from, subject: msg.subject, text, createdAt: msg.createdAt });
  } catch (err) {
    console.error('[temp-mail] Fetch message failed:', err.message);
    return res.status(500).json({ error: 'Failed to fetch message', message: err.message });
  }
});

app.post('/api/temp-mail/delete', requireTempCapability, async (req, res) => {
  try {
    const session = req.tempMail;
    const address = session.address;
    try {
      await fetch(`https://api.mail.tm/accounts/${encodeURIComponent(session.accountId)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${session.token}` } });
    } catch (e) {
      // ignore provider delete errors
    }
    if (isSupabaseEnabled && supabaseAdmin) {
      await supabaseAdmin.from('temp_mail_sessions').delete().eq('capability', req.tempCapability);
    } else {
      tempMailSessions.delete(req.tempCapability);
    }
    console.log(`[temp-mail] Deleted inbox: ${address}`);
    return res.json({ ok: true });
  } catch (err) {
    console.error('[temp-mail] Delete failed:', err.message);
    return res.status(500).json({ error: 'Failed to delete inbox', message: err.message });
  }
});

// Admin endpoint: temp-mail session stats
app.get('/api/temp-mail/stats', requireAdmin, async (req, res) => {
  try {
    let supabaseSessions = 0;
    let inMemorySessions = tempMailSessions.size;
    
    if (isSupabaseEnabled && supabaseAdmin) {
      const { count } = await supabaseAdmin.from('temp_mail_sessions').select('*', { count: 'exact', head: true });
      if (count !== null) supabaseSessions = count;
    }
    
    return res.json({
      ok: true,
      inMemory: inMemorySessions,
      supabase: supabaseSessions,
      total: inMemorySessions + supabaseSessions,
      ttlHours: TEMP_MAIL_TTL / 1000 / 60 / 60,
      storageMode: isSupabaseEnabled && supabaseAdmin ? 'supabase' : 'in-memory',
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch stats', message: err.message });
  }
});

// Start server and cleanup tasks
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Anvil Tools server started on http://localhost:${PORT}`);
  console.log(`🔐 Admin panel: http://localhost:${PORT}/admin/login`);
  console.log(`💾 Storage mode: ${isSupabaseEnabled && supabaseAdmin ? 'Supabase ✅' : 'In-memory ⚠️'}`);
  console.log(`\n📧 Temp-mail endpoints:`);
  console.log(`   POST   /api/temp-mail/create → New inbox`);
  console.log(`   GET    /api/temp-mail/messages → List messages`);  
  console.log(`   GET    /api/temp-mail/messages/:id → Fetch message`);
  console.log(`   POST   /api/temp-mail/delete → Delete inbox`);
  console.log(`   GET    /api/temp-mail/stats (admin only) → Session stats`);
  console.log(`\n🛡️  Rate limiting: 5 creates/hour per IP`);
  console.log();
  
  startCleanupTask();
  console.log(`⏰ Session cleanup task started (every 10 minutes)`);
  console.log();
});
