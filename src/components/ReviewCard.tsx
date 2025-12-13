import { format } from 'date-fns'

interface ReviewCardProps {
  review: any
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="border-b pb-4 last:border-b-0">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold">
            {review.reviewer.firstName[0]}
          </div>
          <div>
            <p className="font-medium">
              {review.reviewer.firstName} {review.reviewer.lastName}
            </p>
            <p className="text-sm text-gray-500">
              {format(new Date(review.createdAt), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <span className="text-yellow-500">★</span>
          <span className="ml-1 font-semibold">{review.rating}</span>
        </div>
      </div>
      <p className="text-gray-700">{review.comment}</p>
    </div>
  )
}
