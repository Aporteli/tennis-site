import { NextResponse } from 'next/server';
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from '../../../../lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json()) as {
      email?: string;
      password?: string;
    };

    const okEmail = email?.trim() === process.env.ADMIN_EMAIL;
    const okPass = password === process.env.ADMIN_PASSWORD;

    if (!okEmail || !okPass) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await createSessionToken();
    const res = NextResponse.json({ ok: true });

    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });

    return res;
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}