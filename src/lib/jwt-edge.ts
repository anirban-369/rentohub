// Edge-compatible JWT utilities using jose library
import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
)

export interface UserJWTPayload {
  userId: string
  email: string
  role: string
}

export async function generateTokenEdge(payload: UserJWTPayload): Promise<string> {
  return await new SignJWT({ 
    userId: payload.userId,
    email: payload.email,
    role: payload.role
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(JWT_SECRET)
}

export async function verifyTokenEdge(token: string): Promise<UserJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
    }
  } catch (error: any) {
    console.error('🔍 Edge JWT verification error:', error.message)
    return null
  }
}
