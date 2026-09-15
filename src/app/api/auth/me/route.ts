import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE } from '../../../../lib/auth';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const ok = await verifySessionToken(token);
  return NextResponse.json({
    user: ok ? { email: process.env.ADMIN_EMAIL } : null,
  });
}
