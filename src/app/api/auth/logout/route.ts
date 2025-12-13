import { NextResponse } from 'next/server'
import { logoutAction } from '@/app/actions/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST() {
  try {
    console.log('🚪 Logout API called')
    await logoutAction()
    console.log('✅ Logout successful')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Logout error:', error)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}
