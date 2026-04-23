import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('error', 'Authentication failed. Please try again.');
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.redirect(new URL('/dashboard', request.url));
}
