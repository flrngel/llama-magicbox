import { NextRequest, NextResponse } from 'next/server';
import { getRatingsBySolution } from '@/lib/data';
import { ensureInitialized } from '@/lib/database';

// Ensure database is initialized
ensureInitialized();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ solutionId: string }> }
) {
  try {
    const { solutionId } = await params;
    
    if (!solutionId) {
      return NextResponse.json(
        { error: 'Solution ID is required' },
        { status: 400 }
      );
    }

    const ratings = getRatingsBySolution(solutionId);
    
    return NextResponse.json(ratings);
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    );
  }
}