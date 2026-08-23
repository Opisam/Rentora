import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:5000';

// Ramping pattern that mimics realistic daily traffic on the browse path
export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
    checks: ['rate>0.99'],
  },
};

export function setup() {
  const res = http.post(
    `${BASE}/auth/login`,
    JSON.stringify({
      email: __ENV.TEST_EMAIL || 'tenant@demo.com',
      password: __ENV.TEST_PASSWORD || 'Demo1234!',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(res, { 'login 200': r => r.status === 200 });
  return res.json('token');
}

export default function (token) {
  const res = http.get(`${BASE}/properties/units/vacant`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  check(res, { 'status 200': r => r.status === 200 });
  sleep(1);
}
