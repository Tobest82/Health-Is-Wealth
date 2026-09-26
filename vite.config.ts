import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { defineConfig } from 'vite';

// Secure Admin Sessions store
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'tontobest82';
const ADMIN_EMAIL = 'emmanueltobest73@gmail.com';
const sessions = new Map<string, { email: string; createdAt: number }>();

function parseBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: any) => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (e) {
        resolve({});
      }
    });
  });
}

function verifyAuth(req: any): boolean {
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
    const pubFile = path.resolve(process.cwd(), 'public/supabase-config.json');
    const rootFile = path.resolve(process.cwd(), 'supabase-config.json');
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

async function handleAdminMiddleware(req: any, res: any, next: any) {
  const url = req.url || '';
  const [pathname] = url.split('?');

  // Serve static uploads fallback from public/uploads if requested
  if (pathname.startsWith('/uploads/')) {
    const filename = pathname.replace('/uploads/', '');
    const safeFilename = path.basename(filename);
    const filePath = path.resolve(process.cwd(), 'public/uploads', safeFilename);
    if (fs.existsSync(filePath)) {
      const ext = path.extname(safeFilename).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml'
      };
      res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
      return fs.createReadStream(filePath).pipe(res);
    }
  }

  // 1. Admin Login (Authenticates against Supabase Auth & validates credentials)
  if (pathname === '/api/admin/login' && req.method === 'POST') {
    const data = await parseBody(req);
    const { email, password } = data;
    const inputEmail = (email || '').trim().toLowerCase();
    const inputPassword = (password || '').trim();

    if (!inputPassword) {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(400);
      return res.end(JSON.stringify({ success: false, message: 'Password is required' }));
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

    // Direct password match fallback
    if (!authSuccess && inputPassword === ADMIN_PASSWORD) {
      authSuccess = true;
    }

    if (authSuccess) {
      const token = crypto.randomBytes(32).toString('hex');
      sessions.set(token, {
        email: authUser.email,
        createdAt: Date.now()
      });

      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      return res.end(JSON.stringify({
        success: true,
        token,
        supabaseToken,
        user: authUser
      }));
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(401);
      return res.end(JSON.stringify({
        success: false,
        message: 'Invalid administrator credentials. Access denied.'
      }));
    }
  }

  // 2. Admin Verify
  if (pathname === '/api/admin/verify' && req.method === 'GET') {
    if (verifyAuth(req)) {
      const authHeader = req.headers['authorization'] || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      const session = sessions.get(token);
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      return res.end(JSON.stringify({
        valid: true,
        user: { email: session?.email || ADMIN_EMAIL, role: 'admin' }
      }));
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(401);
      return res.end(JSON.stringify({ valid: false, message: 'Unauthorized or expired session' }));
    }
  }

  // 3. Admin Logout
  if (pathname === '/api/admin/logout' && req.method === 'POST') {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token) sessions.delete(token);
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    return res.end(JSON.stringify({ success: true }));
  }

  // 4. Media List (Fetches from Supabase Storage bucket 'product-images')
  if (pathname === '/api/admin/media-list' && req.method === 'GET') {
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

      // Check local public/uploads directory if any
      const uploadsDir = path.resolve(process.cwd(), 'public/uploads');
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

      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      return res.end(JSON.stringify({ files, bucket: 'product-images' }));
    } catch (e: any) {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(500);
      return res.end(JSON.stringify({ files: [], error: e.message }));
    }
  }

  // 5. Upload Media to Supabase Storage bucket 'product-images'
  if (pathname === '/api/admin/upload-media' && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      const { filename, dataUrl } = data;
      if (!dataUrl) {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(400);
        return res.end(JSON.stringify({ success: false, message: 'Missing image data' }));
      }

      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(400);
        return res.end(JSON.stringify({ success: false, message: 'Invalid base64 payload' }));
      }

      const mimeType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      const safeName = path.basename(filename || 'image.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniqueName = `${Date.now()}_${safeName}`;

      const { url: supabaseUrl, serviceKey } = getSupabaseConfig();

      // Upload directly to Supabase Storage
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

      // Save local backup in public/uploads as well
      try {
        const uploadsDir = path.resolve(process.cwd(), 'public/uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        fs.writeFileSync(path.resolve(uploadsDir, uniqueName), buffer);
      } catch (err) {}

      if (uploadRes.ok) {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        return res.end(JSON.stringify({
          success: true,
          url: publicSupabaseUrl,
          name: uniqueName,
          bucket: 'product-images',
          storage: 'supabase'
        }));
      } else {
        const errText = await uploadRes.text();
        console.warn('[Supabase Storage] Upload error, serving local fallback:', uploadRes.status, errText);
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        return res.end(JSON.stringify({
          success: true,
          url: `/uploads/${uniqueName}`,
          name: uniqueName,
          storage: 'local_fallback'
        }));
      }
    } catch (err: any) {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(500);
      return res.end(JSON.stringify({ success: false, message: err.message }));
    }
  }

  // 6. Delete Media from Supabase Storage
  if (pathname === '/api/admin/delete-media' && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      const { filename } = data;
      if (!filename) {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(400);
        return res.end(JSON.stringify({ success: false, message: 'Missing filename' }));
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

      // Remove local copy if exists
      try {
        const localPath = path.resolve(process.cwd(), 'public/uploads', filename);
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      } catch (e) {}

      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      return res.end(JSON.stringify({ success: true, message: `File "${filename}" deleted from Supabase Storage` }));
    } catch (err: any) {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(500);
      return res.end(JSON.stringify({ success: false, message: err.message }));
    }
  }

  // 7. Supabase Config API
  if (pathname === '/api/supabase-config') {
    if (req.method === 'GET') {
      try {
        const filePath = path.resolve(process.cwd(), 'public/supabase-config.json');
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(200);
          return res.end(content);
        }
      } catch (e) {}

      const envUrl = process.env.VITE_SUPABASE_URL || '';
      const envKey = process.env.VITE_SUPABASE_ANON_KEY || '';
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      return res.end(JSON.stringify({ url: envUrl, key: envKey }));
    }

    if (req.method === 'POST') {
      const parsed = await parseBody(req);
      try {
        if (parsed.url && parsed.key) {
          const pubFile = path.resolve(process.cwd(), 'public/supabase-config.json');
          const rootFile = path.resolve(process.cwd(), 'supabase-config.json');
          fs.writeFileSync(pubFile, JSON.stringify(parsed, null, 2));
          fs.writeFileSync(rootFile, JSON.stringify(parsed, null, 2));
        }
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        return res.end(JSON.stringify({ success: true }));
      } catch (e: any) {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(400);
        return res.end(JSON.stringify({ error: e.message }));
      }
    }
  }

  // 8. Route /admin to /admin/index.html
  if (pathname === '/admin' || pathname === '/admin/') {
    req.url = '/admin/index.html';
  }

  next();
}

export default defineConfig(() => {
  return {
    plugins: [
      {
        name: 'server-middleware',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = req.url || '';
            if (url.endsWith('.html') || url.endsWith('.js') || url.endsWith('.json') || url === '/' || url.startsWith('/admin')) {
              res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
              res.setHeader('Pragma', 'no-cache');
              res.setHeader('Expires', '0');
            }
            next();
          });
          server.middlewares.use(handleAdminMiddleware);
        },
        configurePreviewServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = req.url || '';
            if (url.endsWith('.html') || url.endsWith('.js') || url.endsWith('.json') || url === '/' || url.startsWith('/admin')) {
              res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
              res.setHeader('Pragma', 'no-cache');
              res.setHeader('Expires', '0');
            }
            next();
          });
          server.middlewares.use(handleAdminMiddleware);
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          admin: path.resolve(__dirname, 'admin/index.html'),
        },
      },
    },
  };
});
