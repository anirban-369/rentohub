import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionAction } from '@/app/actions/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Session API called')
    const user = await getSessionAction()
    
    if (!user) {
      console.log('❌ No session found')
      return NextResponse.json({ user: null }, { 
        status: 401,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      })
    }

    console.log('✅ Session found for:', user.email)
    return NextResponse.json({ user }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    console.error('❌ Session error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      }
    })
  }
}
