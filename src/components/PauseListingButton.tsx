'use client'

import { useState } from 'react'
import { toggleListingAvailabilityAction } from '@/app/actions/listings'

export default function PauseListingButton({
  listingId,
  isPaused,
}: {
  listingId: string
  isPaused: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [paused, setPaused] = useState(isPaused)

  async function handleToggle() {
    setLoading(true)
    try {
      const result = await toggleListingAvailabilityAction(listingId)
      if (result.success) {
        setPaused(result.isPaused || false)
      }
    } catch (err) {
      console.error('Error toggling listing:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-3 py-1 text-sm rounded-lg transition ${
        paused
          ? 'bg-red-100 text-red-700 hover:bg-red-200'
          : 'bg-green-100 text-green-700 hover:bg-green-200'
      } disabled:opacity-50`}
    >
      {loading ? 'Updating...' : paused ? 'Paused' : 'Active'}
    </button>
  )
}
