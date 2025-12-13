import AWS from 'aws-sdk'

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
})

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || ''

export async function uploadToS3(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const params = {
    Bucket: BUCKET_NAME,
    Key: `${Date.now()}-${fileName}`,
    Body: file,
    ContentType: contentType,
  }

  const result = await s3.upload(params).promise()
  return result.Location
}

// Generate a pre-signed URL for viewing private objects (valid for 1 hour)
export function getSignedUrl(fileUrl: string): string {
  if (!fileUrl || !fileUrl.includes(BUCKET_NAME)) {
    return fileUrl
  }
  
  const key = fileUrl.split('.com/')[1]
  if (!key) return fileUrl
  
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: 3600, // URL valid for 1 hour
  }
  
  return s3.getSignedUrl('getObject', params)
}

export async function deleteFromS3(fileUrl: string): Promise<void> {
  const key = fileUrl.split('.com/')[1]
  
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
  }

  await s3.deleteObject(params).promise()
}

export async function uploadMultipleToS3(
  files: { buffer: Buffer; fileName: string; contentType: string }[]
): Promise<string[]> {
  const uploadPromises = files.map((file) =>
    uploadToS3(file.buffer, file.fileName, file.contentType)
  )
  return Promise.all(uploadPromises)
}
