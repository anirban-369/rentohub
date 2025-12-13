// JWT utilities only (no bcrypt, safe for middleware)
import jwt from 'jsonwebtoken'

// Load JWT secret - ensure it's available
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Log once at startup to verify
if (typeof window === 'undefined') {
  console.log('🔑 JWT_SECRET loaded:', JWT_SECRET ? `${JWT_SECRET.substring(0, 10)}... (${JWT_SECRET.length} chars)` : 'NOT FOUND')
}

export interface JWTPayload {
  userId: string
  email: string
  role: string
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    console.log('🔍 Token verified successfully:', decoded.email)
    return decoded
  } catch (error: any) {
    console.error('🔍 Token verification error:', error.message)
    console.error('🔍 Token was:', token.substring(0, 30) + '...')
    console.error('🔍 Secret being used:', JWT_SECRET ? JWT_SECRET.substring(0, 10) + '...' : 'NO SECRET')
    return null
  }
}
