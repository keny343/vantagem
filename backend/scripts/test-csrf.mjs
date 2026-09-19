import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';

const jar = 'cookies-test.txt';
try {
  unlinkSync(jar);
} catch {
  /* ignore */
}

const csrfRes = await fetch('http://localhost:4200/api/auth/csrf', {
  headers: { cookie: '' },
});
const setCookie = csrfRes.headers.getSetCookie?.() ?? [];
console.log('csrf status', csrfRes.status, await csrfRes.json());
console.log('set-cookie', setCookie);

const csrfCookie = setCookie.find((c) => c.startsWith('vantagem_csrf='));
const csrfValue = csrfCookie?.split(';')[0]?.split('=')[1];
if (!csrfValue) throw new Error('no csrf cookie');

const noHeader = await fetch('http://localhost:4200/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Cookie: `vantagem_csrf=${csrfValue}`,
  },
  body: JSON.stringify({ email: 'admin@vantagem.pt', password: 'AdminDemo!2026' }),
});
console.log('without header', noHeader.status, await noHeader.json());

const withHeader = await fetch('http://localhost:4200/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Cookie: `vantagem_csrf=${csrfValue}`,
    'X-CSRF-Token': csrfValue,
  },
  body: JSON.stringify({ email: 'admin@vantagem.pt', password: 'AdminDemo!2026' }),
});
console.log('with header', withHeader.status, await withHeader.json());

const produto = await fetch('http://localhost:4200/api/produtos/mag-15');
const body = await produto.json();
console.log('mag-15 stock', body.product.stock);
