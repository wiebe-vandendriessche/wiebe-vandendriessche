import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') || '/admin'
  if (!code) {
    return NextResponse.redirect(new URL(next, request.url))
  }

  const res = NextResponse.redirect(new URL(next, request.url))
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, { ...options, maxAge: 3600 })
          })
        },
      },
    }
  )

  // Exchange code for a session and store it in cookies
  await supabase.auth.exchangeCodeForSession(code)

  return res
}
