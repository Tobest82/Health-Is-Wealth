import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      {
        name: 'admin-route-handler',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = req.url || '';
            const [pathname, search] = url.split('?');
            const queryString = search ? '?' + search : '';

            if (pathname === '/admin') {
              res.writeHead(302, { Location: '/admin/' + queryString });
              return res.end();
            }
            if (pathname === '/admin/' || pathname === '/admin/index.html') {
              req.url = '/admin/index.html' + queryString;
            }
            next();
          });
        },
        configurePreviewServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = req.url || '';
            const [pathname, search] = url.split('?');
            const queryString = search ? '?' + search : '';

            if (pathname === '/admin') {
              res.writeHead(302, { Location: '/admin/' + queryString });
              return res.end();
            }
            if (pathname === '/admin/' || pathname === '/admin/index.html') {
              req.url = '/admin/index.html' + queryString;
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
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
