import { NextResponse } from 'next/server'
import { getSessionAction } from '@/app/actions/auth'
import { getAuthCookie } from '@/lib/auth'
import { verifyToken } from '@/lib/jwt-utils'

export async function GET() {
  try {
    // Get raw cookie
    const rawCookie = await getAuthCookie()
    console.log('📋 Test Auth - Raw cookie:', rawCookie ? rawCookie.substring(0, 20) + '...' : 'NO COOKIE')

    // Verify token
    if (rawCookie) {
      const verified = verifyToken(rawCookie)
      console.log('✅ Token verification result:', verified)
    }

    // Get session
    const session = await getSessionAction()
    console.log('✅ Session:', session)

    return NextResponse.json({
      hasCookie: !!rawCookie,
      cookiePreview: rawCookie ? rawCookie.substring(0, 20) + '...' : null,
      session,
    })
  } catch (error) {
    console.error('❌ Test auth error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
