import { NextRequest, NextResponse } from 'next/server';
import { getSolutionById } from '@/lib/db-operations';
import { initializeDatabase } from '@/lib/database';

// Initialize database on first API call
let isInitialized = false;
function ensureInitialized() {
  if (!isInitialized) {
    initializeDatabase();
    isInitialized = true;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    ensureInitialized();
    const solution = getSolutionById(params.id);
    
    if (!solution) {
      return NextResponse.json({ error: 'Solution not found' }, { status: 404 });
    }
    
    return NextResponse.json({ solution });
  } catch (error) {
    console.error('Error fetching solution:', error);
    return NextResponse.json({ error: 'Failed to fetch solution' }, { status: 500 });
  }
}