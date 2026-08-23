import http from 'k6/http';
import { check } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:5000';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<300'],
  },
};

export default function () {
  const res = http.get(`${BASE}/properties/units/vacant`);
  check(res, { 'status 200': r => r.status === 200 });
}
