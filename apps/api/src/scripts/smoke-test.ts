const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const RESULTS: { step: string; status: 'PASS' | 'FAIL'; detail?: string }[] = [];

let accessToken: string | null = null;
let refreshToken: string | null = null;

function record(step: string, status: 'PASS' | 'FAIL', detail?: string) {
  RESULTS.push({ step, status, detail });
  const icon = status === 'PASS' ? '  PASS' : '  FAIL';
  console.log(`${icon} ${step}${detail ? ` — ${detail}` : ''}`);
}

async function api(path: string, options?: RequestInit) {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  const res = await fetch(url, { ...options, headers, signal: AbortSignal.timeout(10000) });
  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await res.json() : null;
  return { status: res.status, ok: res.ok, body, headers: res.headers };
}

async function stepHealthCheck() {
  // GET /live
  try {
    const live = await api('/live');
    if (live.status === 200 && live.body?.status === 'ok') {
      record('GET /live', 'PASS');
    } else {
      record('GET /live', 'FAIL', `Expected 200 with status=ok, got ${live.status}`);
    }
  } catch (err: any) {
    record('GET /live', 'FAIL', err.message);
  }

  // GET /ready
  try {
    const ready = await api('/ready');
    if (ready.status === 200 && ready.body?.status === 'ok') {
      record('GET /ready', 'PASS');
    } else {
      const detail = ready.body?.checks
        ? Object.entries(ready.body.checks)
            .filter(([, v]: any) => v.status !== 'up')
            .map(([k]) => k)
            .join(', ')
        : '';
      record('GET /ready', 'FAIL', `Status=${ready.status}${detail ? ` (down: ${detail})` : ''}`);
    }
  } catch (err: any) {
    record('GET /ready', 'FAIL', err.message);
  }
}

async function stepRegister() {
  const timestamp = Date.now();
  const email = `smoketest_${timestamp}@tradingo.test`;
  const password = 'Test@1234';

  try {
    const res = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name: 'Smoke Tester' }),
    });

    if (res.status === 201 && res.body?.accessToken) {
      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
      record('POST /auth/register', 'PASS', `Created user ${email}`);
    } else if (res.status === 409) {
      record('POST /auth/register', 'FAIL', `Conflict: email ${email} already exists`);
    } else {
      record('POST /auth/register', 'FAIL', `Expected 201 with accessToken, got ${res.status}`);
    }
  } catch (err: any) {
    record('POST /auth/register', 'FAIL', err.message);
  }
}

async function stepLogin() {
  const timestamp = Date.now();
  const email = `smoketest_login_${timestamp}@tradingo.test`;
  const password = 'Test@1234';

  // First register the user
  try {
    const reg = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name: 'Login Tester' }),
    });
    if (reg.status !== 201) {
      record('POST /auth/login', 'FAIL', `Could not register login test user (${reg.status})`);
      return;
    }
  } catch (err: any) {
    record('POST /auth/login', 'FAIL', `Register for login test failed: ${err.message}`);
    return;
  }

  // Now login
  accessToken = null;
  try {
    const res = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: email, password }),
    });

    if (res.status === 200 && res.body?.accessToken) {
      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
      record('POST /auth/login', 'PASS', `Logged in as ${email}`);
    } else {
      record('POST /auth/login', 'FAIL', `Expected 200 with accessToken, got ${res.status}`);
    }
  } catch (err: any) {
    record('POST /auth/login', 'FAIL', err.message);
  }
}

async function stepGetMe() {
  if (!accessToken) {
    record('GET /auth/me', 'FAIL', 'Skipped — no access token');
    return;
  }

  try {
    const res = await api('/auth/me');

    if (res.status === 200 && res.body?.id) {
      record('GET /auth/me', 'PASS', `User: ${res.body.name || res.body.email} (${res.body.role || 'N/A'})`);
    } else {
      record('GET /auth/me', 'FAIL', `Expected 200 with user profile, got ${res.status}`);
    }
  } catch (err: any) {
    record('GET /auth/me', 'FAIL', err.message);
  }
}

async function stepCategories() {
  try {
    const res = await api('/categories');

    if (res.status === 200) {
      const count = Array.isArray(res.body) ? res.body.length : res.body?.data?.length ?? 'N/A';
      record('GET /categories', 'PASS', `${count} categories returned`);
    } else {
      record('GET /categories', 'FAIL', `Expected 200, got ${res.status}`);
    }
  } catch (err: any) {
    record('GET /categories', 'FAIL', err.message);
  }
}

async function stepSearch() {
  try {
    const res = await api('/search?q=test');

    if (res.status === 200) {
      record('GET /search?q=test', 'PASS');
    } else {
      record('GET /search?q=test', 'FAIL', `Expected 200, got ${res.status}`);
    }
  } catch (err: any) {
    record('GET /search?q=test', 'FAIL', err.message);
  }
}

async function stepMyCompany() {
  if (!accessToken) {
    record('GET /companies/my-company', 'FAIL', 'Skipped — no access token');
    return;
  }

  try {
    const res = await api('/companies/my-company');

    if (res.status === 200) {
      record('GET /companies/my-company', 'PASS', `Company: ${res.body?.name || res.body?.companyName || 'N/A'}`);
    } else if (res.status === 404) {
      record('GET /companies/my-company', 'PASS', 'No company linked to this user (expected for fresh user)');
    } else {
      record('GET /companies/my-company', 'FAIL', `Expected 200, got ${res.status}`);
    }
  } catch (err: any) {
    record('GET /companies/my-company', 'FAIL', err.message);
  }
}

async function stepLogout() {
  if (!accessToken) {
    record('POST /auth/logout', 'FAIL', 'Skipped — no access token');
    return;
  }

  try {
    const res = await api('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    if (res.status === 200 || res.status === 204) {
      record('POST /auth/logout', 'PASS', `Logout ${res.status === 204 ? '204 No Content' : '200 OK'}`);
    } else {
      record('POST /auth/logout', 'FAIL', `Expected 200/204, got ${res.status}`);
    }
  } catch (err: any) {
    record('POST /auth/logout', 'FAIL', err.message);
  }
}

async function smokeTest() {
  console.log(`Smoke test — ${BASE_URL}\n`);

  await stepHealthCheck();
  await stepRegister();
  await stepLogin();
  await stepGetMe();
  await stepCategories();
  await stepSearch();
  await stepMyCompany();
  await stepLogout();

  console.log('\n=== SMOKE TEST RESULTS ===');
  let passed = 0, failed = 0;
  for (const r of RESULTS) {
    const icon = r.status === 'PASS' ? '\u2705' : '\u274C';
    console.log(`${icon} ${r.step}${r.detail ? ` \u2014 ${r.detail}` : ''}`);
    if (r.status === 'PASS') passed++; else failed++;
  }
  console.log(`\n${passed} passed, ${failed} failed out of ${RESULTS.length} tests`);
  process.exit(failed > 0 ? 1 : 0);
}

smokeTest().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
