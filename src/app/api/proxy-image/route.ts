import { NextRequest, NextResponse } from 'next/server'
import AWS from 'aws-sdk'

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 })
    }

    // Extract bucket and key from S3 URL
    const urlParts = url.match(/https:\/\/(.+?)\.s3\.(.+?)\.amazonaws\.com\/(.+)/)
    if (!urlParts) {
      return NextResponse.json({ error: 'Invalid S3 URL' }, { status: 400 })
    }

    const bucket = urlParts[1]
    const key = decodeURIComponent(urlParts[3])

    // Get object from S3
    const params = {
      Bucket: bucket,
      Key: key,
    }

    const data = await s3.getObject(params).promise()

    // Return the image as a valid BodyInit
    const bodyBuffer = data.Body as Buffer
    const bodyUint8 = new Uint8Array(bodyBuffer)
    return new NextResponse(bodyUint8, {
      headers: {
        'Content-Type': data.ContentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Image proxy error:', error)
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 })
  }
}
