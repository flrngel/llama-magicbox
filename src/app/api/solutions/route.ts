import { NextRequest, NextResponse } from 'next/server';
import { getSolutions, publishSolutionWithDataItems } from '@/lib/db-operations';
import { initializeDatabase } from '@/lib/database';

// Initialize database on first API call
let isInitialized = false;
function ensureInitialized() {
  if (!isInitialized) {
    initializeDatabase();
    isInitialized = true;
  }
}

export async function GET() {
  try {
    ensureInitialized();
    const solutions = getSolutions();
    return NextResponse.json({ solutions });
  } catch (error) {
    console.error('Error fetching solutions:', error);
    return NextResponse.json({ error: 'Failed to fetch solutions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    ensureInitialized();
    const body = await request.json();
    const { solutionData, dataItemsData } = body;
    
    const newSolution = publishSolutionWithDataItems(solutionData, dataItemsData);
    return NextResponse.json({ solution: newSolution });
  } catch (error) {
    console.error('Error creating solution:', error);
    return NextResponse.json({ error: 'Failed to create solution' }, { status: 500 });
  }
}