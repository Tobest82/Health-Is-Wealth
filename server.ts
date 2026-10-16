import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Secure Admin Sessions store
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'tontobest82';
const ADMIN_EMAIL = 'emmanueltobest73@gmail.com';
const sessions = new Map<string, { email: string; createdAt: number }>();

function verifyAuth(req: express.Request): boolean {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return false;
  const session = sessions.get(token);
  if (!session) return false;
  // 7 days expiration
  if (Date.now() - session.createdAt > 7 * 24 * 60 * 60 * 1000) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function getCleanServiceKey(): string {
  const raw = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!raw) return '';
  const parts = raw.trim().split('.');
  if (parts.length >= 3) {
    return parts.slice(0, 3).join('.');
  }
  return raw.trim();
}

function getSupabaseConfig() {
  let url = 'https://evfflzolzyfwkheqsrea.supabase.co';
  let key = '';
  try {
    const pubFile = path.resolve(__dirname, 'public/supabase-config.json');
    const rootFile = path.resolve(__dirname, 'supabase-config.json');
    const target = fs.existsSync(pubFile) ? pubFile : rootFile;
    if (fs.existsSync(target)) {
      const parsed = JSON.parse(fs.readFileSync(target, 'utf8'));
      if (parsed.url) url = parsed.url;
      if (parsed.key) key = parsed.key;
    }
  } catch (e) {}
  if (!url) url = process.env.VITE_SUPABASE_URL || '';
  url = url.replace(/\/+$/, '').replace(/\/rest\/v1\/?$/i, '');
  const serviceKey = getCleanServiceKey();
  return { url, key, serviceKey: serviceKey || key };
}

// 1. Admin Login Endpoint
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body || {};
  const inputEmail = (email || '').trim().toLowerCase();
  const inputPassword = (password || '').trim();

  if (!inputPassword) {
    return res.status(400).json({ success: false, message: 'Password is required' });
  }

  const { url: supabaseUrl, key: supabaseAnonKey } = getSupabaseConfig();
  let authSuccess = false;
  let authUser = { email: inputEmail || ADMIN_EMAIL, role: 'admin' };
  let supabaseToken = '';

  // Attempt Supabase Auth sign in
  try {
    const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: inputEmail || ADMIN_EMAIL,
        password: inputPassword
      })
    });

    if (authRes.ok) {
      const authData = await authRes.json();
      if (authData && authData.access_token) {
        authSuccess = true;
        supabaseToken = authData.access_token;
        if (authData.user && authData.user.email) {
          authUser.email = authData.user.email;
        }
      }
    }
  } catch (authErr) {
    console.warn('[Admin Auth] Supabase Auth connection note:', authErr);
  }

  // Master password fallback for administrator
  if (!authSuccess && inputPassword === ADMIN_PASSWORD) {
    authSuccess = true;
  }

  if (authSuccess) {
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, {
      email: authUser.email,
      createdAt: Date.now()
    });

    return res.json({
      success: true,
      token,
      supabaseToken,
      user: authUser
    });
  } else {
    return res.status(401).json({
      success: false,
      message: 'Invalid administrator credentials. Access denied.'
    });
  }
});

// 2. Admin Verify
app.get('/api/admin/verify', (req, res) => {
  if (verifyAuth(req)) {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const session = sessions.get(token);
    return res.json({
      valid: true,
      user: { email: session?.email || ADMIN_EMAIL, role: 'admin' }
    });
  } else {
    return res.status(401).json({ valid: false, message: 'Unauthorized or expired session' });
  }
});

// 3. Admin Logout
app.post('/api/admin/logout', (req, res) => {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (token) sessions.delete(token);
  return res.json({ success: true });
});

// 4. Media List
app.get('/api/admin/media-list', async (_req, res) => {
  try {
    const { url: supabaseUrl, serviceKey } = getSupabaseConfig();
    const listRes = await fetch(`${supabaseUrl}/storage/v1/object/list/product-images`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prefix: '', limit: 100 })
    });

    let files: any[] = [];
    if (listRes.ok) {
      const data = await listRes.json();
      if (Array.isArray(data)) {
        files = data.filter((f: any) => f.name && !f.name.startsWith('.')).map((f: any) => ({
          name: f.name,
          url: `${supabaseUrl}/storage/v1/object/public/product-images/${encodeURIComponent(f.name)}`,
          size: f.metadata?.size || 0,
          mimetype: f.metadata?.mimetype || 'image/jpeg',
          createdAt: f.created_at || f.updated_at
        }));
      }
    }

    const uploadsDir = path.resolve(__dirname, 'public/uploads');
    if (fs.existsSync(uploadsDir)) {
      const localFiles = fs.readdirSync(uploadsDir).filter(f => !f.startsWith('.'));
      localFiles.forEach(f => {
        if (!files.some(existing => existing.name === f)) {
          files.push({
            name: f,
            url: `/uploads/${f}`,
            size: 0,
            mimetype: 'image/jpeg',
            createdAt: new Date().toISOString()
          });
        }
      });
    }

    return res.json({ files, bucket: 'product-images' });
  } catch (e: any) {
    return res.status(500).json({ files: [], error: e.message });
  }
});

// 5. Upload Media
app.post('/api/admin/upload-media', async (req, res) => {
  try {
    const { filename, dataUrl } = req.body || {};
    if (!dataUrl) {
      return res.status(400).json({ success: false, message: 'Missing image data' });
    }

    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, message: 'Invalid base64 payload' });
    }

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const safeName = path.basename(filename || 'image.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueName = `${Date.now()}_${safeName}`;

    const { url: supabaseUrl, serviceKey } = getSupabaseConfig();

    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/product-images/${encodeURIComponent(uniqueName)}`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': mimeType,
        'x-upsert': 'true'
      },
      body: buffer
    });

    const publicSupabaseUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${encodeURIComponent(uniqueName)}`;

    try {
      const uploadsDir = path.resolve(__dirname, 'public/uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      fs.writeFileSync(path.resolve(uploadsDir, uniqueName), buffer);
    } catch (err) {}

    if (uploadRes.ok) {
      return res.json({
        success: true,
        url: publicSupabaseUrl,
        name: uniqueName,
        bucket: 'product-images',
        storage: 'supabase'
      });
    } else {
      return res.json({
        success: true,
        url: `/uploads/${uniqueName}`,
        name: uniqueName,
        storage: 'local_fallback'
      });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Delete Media
app.post('/api/admin/delete-media', async (req, res) => {
  try {
    const { filename } = req.body || {};
    if (!filename) {
      return res.status(400).json({ success: false, message: 'Missing filename' });
    }

    const { url: supabaseUrl, serviceKey } = getSupabaseConfig();
    await fetch(`${supabaseUrl}/storage/v1/object/product-images`, {
      method: 'DELETE',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prefixes: [filename] })
    });

    try {
      const localPath = path.resolve(__dirname, 'public/uploads', filename);
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    } catch (e) {}

    return res.json({ success: true, message: `File "${filename}" deleted` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 7. Supabase Config API
app.get('/api/supabase-config', (_req, res) => {
  try {
    const filePath = path.resolve(__dirname, 'public/supabase-config.json');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return res.setHeader('Content-Type', 'application/json').send(content);
    }
  } catch (e) {}

  const envUrl = process.env.VITE_SUPABASE_URL || '';
  const envKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  return res.json({ url: envUrl, key: envKey });
});

app.post('/api/supabase-config', (req, res) => {
  try {
    const { url, key } = req.body || {};
    if (url && key) {
      const pubFile = path.resolve(__dirname, 'public/supabase-config.json');
      const rootFile = path.resolve(__dirname, 'supabase-config.json');
      fs.writeFileSync(pubFile, JSON.stringify({ url, key }, null, 2));
      fs.writeFileSync(rootFile, JSON.stringify({ url, key }, null, 2));
    }
    return res.json({ success: true });
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'prod';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));

    app.get('/admin', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'admin/index.html'));
    });
    app.get('/admin/*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'admin/index.html'));
    });
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[Health is Wealth Server] Running on http://0.0.0.0:${PORT} (Mode: ${isProduction ? 'Production' : 'Development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
