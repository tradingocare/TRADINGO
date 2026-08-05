import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function postWithCsrf(path: string, data: unknown): Promise<void> {
  const csrfRes = await fetch(`${API_URL}/auth/csrf`, { method: 'GET' });
  const csrf = (await csrfRes.json()) as { token?: string };
  const setCookie = csrfRes.headers.get('set-cookie') ?? '';
  await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(csrf.token ? { 'x-csrf-token': csrf.token } : {}),
      ...(setCookie ? { Cookie: setCookie.split(';')[0] } : {}),
    },
    body: JSON.stringify(data),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    if (!type || !['bug', 'feature', 'nps'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    if (type === 'bug') {
      const { title, description, category, priority, browserInfo } = body;
      if (!title?.trim()) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 });
      }
      await postWithCsrf('/beta-feedback', { type: type.toUpperCase(), title, description, category, priority, browserInfo });
    }

    if (type === 'feature') {
      const { title, description, category, businessImpact } = body;
      if (!title?.trim()) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 });
      }
      await postWithCsrf('/beta-feedback', { type: type.toUpperCase(), title, description, category, businessImpact });
    }

    if (type === 'nps') {
      const { score, comment } = body;
      if (score === undefined || score < 0 || score > 10) {
        return NextResponse.json({ error: 'Valid score (0-10) is required' }, { status: 400 });
      }
      await postWithCsrf('/beta-feedback', { type: 'NPS', score, comment });
    }

    return NextResponse.json({ success: true, message: 'Feedback submitted' });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
