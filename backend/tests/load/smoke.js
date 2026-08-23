import autocannon from 'autocannon';

const BASE = process.env.BASE_URL || 'http://localhost:5000';
const EMAIL = process.env.TEST_EMAIL || 'tenant@demo.com';
const PASSWORD = process.env.TEST_PASSWORD || 'Demo1234!';

async function login() {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login failed (${res.status})`);
  return (await res.json()).token;
}

function run(name, path, headers = {}) {
  return new Promise((resolve, reject) => {
    autocannon(
      {
        url: `${BASE}${path}`,
        connections: Number(process.env.CONNECTIONS || 5),
        duration: Number(process.env.DURATION || 10),
        headers,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve({
          endpoint: name,
          'req/sec': Math.round(result.requests.average),
          'p50 (ms)': result.latency.p50,
          'p90 (ms)': result.latency.p90,
          'p99 (ms)': result.latency.p99,
          errors: result.errors,
          ...Object.fromEntries(
            Object.entries(result.statusCodeStats || {})
              .filter(([, s]) => s.count > 0)
              .map(([code, s]) => [`HTTP ${code}`, s.count])
          ),
        });
      }
    );
  });
}

const token = await login();
const rows = [];
rows.push(await run('GET /health', '/health'));
rows.push(await run('GET /properties/units/vacant', '/properties/units/vacant', {
  Authorization: `Bearer ${token}`,
}));
console.log(`\nBaseline vs ${BASE} (${process.env.CONNECTIONS || 5} conns x ${process.env.DURATION || 10}s each)\n`);
console.table(rows);
