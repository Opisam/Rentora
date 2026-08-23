const API = 'http://localhost:5000';

export async function loginAs(request, email, password) {
  const res = await request.post(`${API}/auth/login`, { data: { email, password } });
  if (!res.ok()) throw new Error(`API login failed for ${email}: ${res.status()}`);
  const body = await res.json();
  return { token: body.token, user: body.user };
}

export function seedSession(page, session) {
  page.addInitScript(
    ({ token, user }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    session
  );
}

export async function gotoAs(page, request, email, password, path) {
  seedSession(page, await loginAs(request, email, password));
  await page.goto(path);
}
