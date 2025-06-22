import { NextRequest, NextResponse } from 'next/server';
import { getSolutionsByCreator } from '@/lib/data';
import { ensureInitialized } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    ensureInitialized();
    
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    
    if (!creatorId) {
      return NextResponse.json(
        { error: 'Creator ID is required' },
        { status: 400 }
      );
    }
    
    const solutions = getSolutionsByCreator(creatorId);
    
    return NextResponse.json({ solutions });
  } catch (error) {
    console.error('Error fetching solutions by creator:', error);
    return NextResponse.json(
      { error: 'Failed to fetch solutions' },
      { status: 500 }
    );
  }
}