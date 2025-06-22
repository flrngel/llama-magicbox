'use server';

import { createRating, getUserRatingForSolution, getRatingStats } from '@/lib/data';

export async function submitRatingAction(
  solutionId: string,
  userId: string,
  rating: number,
  comment?: string
) {
  try {
    // Validate rating
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return {
        success: false,
        error: 'Rating must be an integer between 1 and 5'
      };
    }

    // Validate comment length
    if (comment && comment.length > 500) {
      return {
        success: false,
        error: 'Comment must be less than 500 characters'
      };
    }

    // Create the rating
    const result = await createRating(solutionId, userId, rating, comment);
    return result;
  } catch (error) {
    console.error('Error in submitRatingAction:', error);
    return {
      success: false,
      error: 'Failed to submit rating'
    };
  }
}

export async function getUserRatingAction(userId: string, solutionId: string) {
  try {
    const rating = await getUserRatingForSolution(userId, solutionId);
    return {
      success: true,
      data: rating
    };
  } catch (error) {
    console.error('Error in getUserRatingAction:', error);
    return {
      success: false,
      error: 'Failed to get user rating'
    };
  }
}

export async function getRatingStatsAction(solutionId: string) {
  try {
    const stats = await getRatingStats(solutionId);
    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('Error in getRatingStatsAction:', error);
    return {
      success: false,
      error: 'Failed to get rating statistics'
    };
  }
}