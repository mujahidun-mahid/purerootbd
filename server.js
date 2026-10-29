'use strict';

/**
 * HostSeba / Webuzo / cPanel Node.js startup file.
 *
 * Next.js `next start` is a thin wrapper around this same handler. A plain
 * server.js is used here because application managers on shared Node hosting
 * need a concrete startup file and a process that can handle SIGTERM cleanly.
 *
 * Vercel does not use this file; it uses its own Next.js runtime.
 */

if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production';

const http = require('node:http');
const next = require('next');

const port = Number.parseInt(process.env.PORT || '3000', 10);
// 0.0.0.0 is required by some panel proxies. If Webuzo/cPanel connects to the
// app locally you can set HOST=127.0.0.1 in the application environment.
const hostname = process.env.HOST || '0.0.0.0';
const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

let server;
let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received; closing Pure Roots server…`);

  if (!server) {
    process.exit(0);
    return;
  }

  server.close(() => {
    console.log('Pure Roots server closed.');
    process.exit(0);
  });

  // Do not let a stuck keep-alive connection prevent a panel restart forever.
  setTimeout(() => {
    console.error('Forcing shutdown after timeout.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

app
  .prepare()
  .then(() => {
    server = http.createServer((req, res) => {
      Promise.resolve(handle(req, res)).catch((error) => {
        console.error('Unhandled request error:', error);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('content-type', 'text/plain; charset=utf-8');
          res.end('Internal Server Error');
        } else {
          res.destroy();
        }
      });
    });

    // Common reverse-proxy timeouts; keeps upstream connections from being
    // closed before the proxy does.
    server.keepAliveTimeout = 65_000;
    server.headersTimeout = 66_000;

    server.on('error', (error) => {
      console.error('Server error:', error);
      process.exit(1);
    });

    server.listen(port, hostname, () => {
      console.log(`Pure Roots listening on http://${hostname}:${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start Pure Roots:', error);
    process.exit(1);
  });
