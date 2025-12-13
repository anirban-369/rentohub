import { NextRequest, NextResponse } from 'next/server'
import { uploadToS3 } from '@/lib/storage'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'image', 'delivery-proof', 'delivery-proof-video'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')

    // Validate file type based on upload type
    if (type === 'delivery-proof-video') {
      if (!isVideo) {
        return NextResponse.json({ error: 'Only video files allowed' }, { status: 400 })
      }
      // Video size limit: 50MB
      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json({ error: 'Video too large (max 50MB)' }, { status: 400 })
      }
    } else {
      // For images
      if (!isImage && !isVideo) {
        return NextResponse.json({ error: 'Only images or videos allowed' }, { status: 400 })
      }
      if (isImage && file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Image too large (max 10MB)' }, { status: 400 })
      }
      if (isVideo && file.size > 50 * 1024 * 1024) {
        return NextResponse.json({ error: 'Video too large (max 50MB)' }, { status: 400 })
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const extension = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg')
    const fileName = `${type || 'upload'}-${user.userId}-${Date.now()}.${extension}`

    console.log('📤 Uploading file:', fileName, 'Size:', file.size, 'Type:', file.type)
    
    const url = await uploadToS3(buffer, fileName, file.type)
    
    console.log('✅ Upload successful:', url)
    return NextResponse.json({ url })
  } catch (error: any) {
    console.error('❌ Upload error:', error)
    console.error('Error details:', error.message, error.stack)
    return NextResponse.json({ 
      error: error.message || 'Upload failed',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
