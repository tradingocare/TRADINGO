import { NextRequest, NextResponse } from 'next/server';

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
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/beta-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: type.toUpperCase(), title, description, category, priority, browserInfo }),
      });
    }

    if (type === 'feature') {
      const { title, description, category, businessImpact } = body;
      if (!title?.trim()) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 });
      }
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/beta-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: type.toUpperCase(), title, description, category, businessImpact }),
      });
    }

    if (type === 'nps') {
      const { score, comment } = body;
      if (score === undefined || score < 0 || score > 10) {
        return NextResponse.json({ error: 'Valid score (0-10) is required' }, { status: 400 });
      }
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/beta-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'NPS', score, comment }),
      });
    }

    return NextResponse.json({ success: true, message: 'Feedback submitted' });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
