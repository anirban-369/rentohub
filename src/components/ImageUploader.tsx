'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { getProxyImageUrl } from '@/lib/image-utils'

interface ImageUploaderProps {
  onUpload: (urls: string[]) => void
  maxFiles?: number
  existingImages?: string[]
}

export default function ImageUploader({
  onUpload,
  maxFiles = 10,
  existingImages = [],
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<string[]>(existingImages)
  const [error, setError] = useState('')

  // Sync with parent when existingImages changes (for edit form updates)
  useEffect(() => {
    setImages(existingImages)
  }, [existingImages])

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (images.length + acceptedFiles.length > maxFiles) {
        setError(`Maximum ${maxFiles} images allowed`)
        return
      }

      setUploading(true)
      setError('')

      try {
        const uploadPromises = acceptedFiles.map(async (file) => {
          const formData = new FormData()
          formData.append('file', file)

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            const errorData = await response.json()
            console.error('Upload failed:', errorData)
            throw new Error(errorData.error || 'Upload failed')
          }
          const data = await response.json()
          return data.url
        })

        const urls = await Promise.all(uploadPromises)
        const newImages = [...images, ...urls]
        setImages(newImages)
        onUpload(newImages)
      } catch (err: any) {
        console.error('Image upload error:', err)
        setError(err.message || 'Failed to upload images. Please try again.')
      } finally {
        setUploading(false)
      }
    },
    [images, maxFiles, onUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: uploading || images.length >= maxFiles,
  })

  function removeImage(index: number) {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    onUpload(newImages)
  }

  return (
    <div className="space-y-4">
      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={getProxyImageUrl(url)}
                alt={`Upload ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {images.length < maxFiles && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
            isDragActive
              ? 'border-primary-600 bg-primary-50'
              : 'border-gray-300 hover:border-primary-600'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {uploading ? (
              <p className="text-gray-600">Uploading...</p>
            ) : (
              <>
                <p className="text-gray-600">
                  {isDragActive
                    ? 'Drop images here'
                    : 'Drag & drop images, or click to select'}
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, WEBP up to 5MB ({images.length}/{maxFiles})
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
