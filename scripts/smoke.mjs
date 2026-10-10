#!/usr/bin/env node
// Simple smoke test helper
import http from 'http';

export function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: 4000,
      path: `/api/v1${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data), headers: res.headers });
        } catch(e) {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// If run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  console.log('Running basic smoke tests...');
  request('GET', '/health').then(res => {
    if (res.status === 200 && res.body.success) {
      console.log('✅ API Health check passed');
    } else {
      console.error('❌ API Health check failed', res);
      process.exit(1);
    }
  }).catch(err => {
    console.error('❌ API uncontactable', err.message);
    process.exit(1);
  });
}
