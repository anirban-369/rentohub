import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import EditListingForm from '@/components/EditListingForm'

export default async function EditListingPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getCurrentUser()
  if (!user) {
    return <div className="p-8 text-center">Please log in to edit listings.</div>
  }

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
  })

  if (!listing) notFound()
  if (listing.userId !== user.userId) {
    return <div className="p-8 text-center">You don't have permission to edit this listing.</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Edit Listing</h1>
        <EditListingForm listing={listing} />
      </div>
    </div>
  )
}
