import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt-utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const authToken = cookieStore.get('auth-token')
    
    console.log('🔍 DEBUG: All cookies:', allCookies.map(c => c.name))
    console.log('🔍 DEBUG: Auth token exists:', !!authToken)
    
    if (authToken) {
      console.log('🔍 DEBUG: Token value (first 20 chars):', authToken.value.substring(0, 20))
      const verified = verifyToken(authToken.value)
      console.log('🔍 DEBUG: Token verification result:', verified)
      
      return NextResponse.json({
        success: true,
        hasAuthToken: true,
        tokenPreview: authToken.value.substring(0, 30) + '...',
        verified: verified,
        allCookies: allCookies.map(c => ({ name: c.name, hasValue: !!c.value }))
      })
    }
    
    return NextResponse.json({
      success: false,
      hasAuthToken: false,
      allCookies: allCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
      message: 'No auth-token cookie found'
    })
  } catch (error) {
    console.error('🔍 DEBUG: Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 })
  }
}
