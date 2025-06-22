import { ensureInitialized, getStatements, rowToRating } from './database';
import { Rating } from './data';
import { randomUUID } from 'crypto';

// Ensure database is initialized
ensureInitialized();

export function createRating(
  solutionId: string,
  userId: string,
  rating: number,
  comment?: string
): { success: true; data: Rating } | { success: false; error: string } {
  try {
    const statements = getStatements();
    const ratingId = `rating-${randomUUID()}`;
    
    // Insert or update the rating
    statements.insertRating.run(ratingId, solutionId, userId, rating, comment || null);
    
    // Calculate new average rating for the solution
    const ratings = statements.getRatingsBySolutionId.all(solutionId) as any[];
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
      : 0;
    
    // Update solution's average rating
    statements.updateSolutionRating.run(averageRating, solutionId);
    
    // Return the created rating
    const createdRating = statements.getRatingByUserAndSolution.get(userId, solutionId) as any;
    return {
      success: true,
      data: rowToRating(createdRating)
    };
  } catch (error) {
    console.error('Error creating rating:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create rating'
    };
  }
}

export function getRatingsBySolution(solutionId: string): Rating[] {
  try {
    const statements = getStatements();
    const rows = statements.getRatingsBySolutionId.all(solutionId) as any[];
    return rows.map(rowToRating);
  } catch (error) {
    console.error('Error getting ratings for solution:', error);
    return [];
  }
}

export function getUserRatingForSolution(
  userId: string,
  solutionId: string
): Rating | null {
  try {
    const statements = getStatements();
    const row = statements.getRatingByUserAndSolution.get(userId, solutionId) as any;
    return row ? rowToRating(row) : null;
  } catch (error) {
    console.error('Error getting user rating:', error);
    return null;
  }
}

export function getRatingStats(solutionId: string): {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: { [key: number]: number };
} {
  try {
    const ratings = getRatingsBySolution(solutionId);
    
    if (ratings.length === 0) {
      return {
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }
    
    const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    ratings.forEach(rating => {
      if (rating.rating >= 1 && rating.rating <= 5) {
        ratingDistribution[rating.rating as keyof typeof ratingDistribution]++;
      }
    });
    
    return {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalRatings: ratings.length,
      ratingDistribution
    };
  } catch (error) {
    console.error('Error getting rating stats:', error);
    return {
      averageRating: 0,
      totalRatings: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }
}