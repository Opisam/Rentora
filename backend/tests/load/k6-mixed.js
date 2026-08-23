import http from 'k6/http';
import { check, sleep, group } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:5000';
const DURATION = __ENV.DURATION || '45s';

// Two personas hitting the API the way a real day looks:
//  - many tenants idly browsing / checking notifications
//  - a few landlords polling their dashboards (reports are the heavy path)
export const options = {
  scenarios: {
    tenants_browsing: {
      executor: 'constant-arrival-rate',
      rate: Number(__ENV.TENANT_RPS || 20),
      timeUnit: '1s',
      duration: DURATION,
      preAllocatedVUs: 30,
      maxVUs: 100,
      exec: 'tenantFlow',
    },
    landlords_working: {
      executor: 'constant-arrival-rate',
      rate: Number(__ENV.LANDLORD_RPS || 4),
      timeUnit: '1s',
      duration: DURATION,
      preAllocatedVUs: 10,
      maxVUs: 30,
      exec: 'landlordFlow',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
    'http_req_duration{flow:tenant}': ['p(95)<300'],
    'http_req_duration{flow:landlord}': ['p(95)<800'],
  },
};

export function setup() {
  const login = (email) => {
    const res = http.post(
      `${BASE}/auth/login`,
      JSON.stringify({ email, password: __ENV.TEST_PASSWORD || 'Demo1234!' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    check(res, { [`login ok (${email})`]: r => r.status === 200 });
    return res.json('token');
  };
  return {
    tenant: login(__ENV.TEST_EMAIL || 'tenant@demo.com'),
    landlord: login('landlord@demo.com'),
  };
}

function authed(token) {
  return { headers: { Authorization: `Bearer ${token}` }, tags: undefined };
}

export function tenantFlow(data) {
  group('tenant browse', () => {
    const res = http.get(`${BASE}/properties/units/vacant`, {
      ...authed(data.tenant),
      tags: { flow: 'tenant' },
    });
    check(res, { 'vacant 200': r => r.status === 200 });

    const notes = http.get(`${BASE}/notifications`, {
      ...authed(data.tenant),
      tags: { flow: 'tenant' },
    });
    check(notes, { 'notifications 200': r => r.status === 200 });
  });
  sleep(2);
}

export function landlordFlow(data) {
  group('landlord dashboard', () => {
    const apps = http.get(`${BASE}/applications`, {
      ...authed(data.landlord),
      tags: { flow: 'landlord' },
    });
    check(apps, { 'applications 200': r => r.status === 200 });

    const leases = http.get(`${BASE}/leases`, {
      ...authed(data.landlord),
      tags: { flow: 'landlord' },
    });
    check(leases, { 'leases 200': r => r.status === 200 });

    const summary = http.get(`${BASE}/reports/summary`, {
      ...authed(data.landlord),
      tags: { flow: 'landlord' },
    });
    check(summary, { 'summary 200': r => r.status === 200 });
  });
  sleep(3);
}
