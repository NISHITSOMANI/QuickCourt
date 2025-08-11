import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Star, X } from 'lucide-react';
import { useMutation, useQueryClient } from 'react-query';
import { reviewApi } from '../../api/reviewApi';
import toast from 'react-hot-toast';

const ReviewForm = ({ venueId, review = null, onClose }) => {
  const queryClient = useQueryClient();
  const [hoveredRating, setHoveredRating] = useState(0);
  const isEditing = !!review;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      rating: review?.rating || 0,
      title: review?.title || '',
      comment: review?.comment || '',
      photos: []
    }
  });

  const selectedRating = watch('rating');

  // Create review mutation
  const createReviewMutation = useMutation(
    (data) => reviewApi.createReview(venueId, data),
    {
      onSuccess: () => {
        toast.success('Review created successfully!');
        queryClient.invalidateQueries(['venue-reviews', venueId]);
        queryClient.invalidateQueries('user-reviews');
        onClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create review');
      }
    }
  );

  // Update review mutation
  const updateReviewMutation = useMutation(
    (data) => reviewApi.updateReview(review._id || review.id, data),
    {
      onSuccess: () => {
        toast.success('Review updated successfully!');
        queryClient.invalidateQueries(['venue-reviews', venueId]);
        queryClient.invalidateQueries('user-reviews');
        onClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update review');
      }
    }
  );

  const onSubmit = async (data) => {
    if (isEditing) {
      await updateReviewMutation.mutateAsync(data);
    } else {
      await createReviewMutation.mutateAsync(data);
    }
  };

  const handleRatingClick = (rating) => {
    setValue('rating', rating);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Review' : 'Write a Review'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 cursor-pointer transition-colors ${
                      star <= (hoveredRating || selectedRating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {errors.rating && (
              <p className="mt-1 text-sm text-red-600">{errors.rating.message}</p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              {...register('title', { required: 'Title is required' })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Summarize your experience"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review
            </label>
            <textarea
              {...register('comment', { required: 'Review is required' })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Share your experience with this venue..."
            />
            {errors.comment && (
              <p className="mt-1 text-sm text-red-600">{errors.comment.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedRating === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : isEditing ? 'Update Review' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewForm;
