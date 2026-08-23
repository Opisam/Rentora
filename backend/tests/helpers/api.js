import request from 'supertest';
import app from '../../src/app.js';

export { app };

export const req = () => request(app);

export async function loginAndGetToken(email, password) {
  const res = await request(app).post('/auth/login').send({ email, password });
  if (res.status !== 200) throw new Error(`login failed for ${email}: ${res.status}`);
  return res.body.token;
}
