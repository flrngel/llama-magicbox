import { NextRequest, NextResponse } from 'next/server';
import { getSolutionBySlug } from '@/lib/db-operations';
import { ensureInitialized } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    ensureInitialized();
    const { slug } = await params;
    const solution = getSolutionBySlug(slug);
    
    if (!solution) {
      return NextResponse.json({ error: 'Solution not found' }, { status: 404 });
    }
    
    return NextResponse.json({ solution });
  } catch (error) {
    console.error('Error fetching solution by slug:', error);
    return NextResponse.json({ error: 'Failed to fetch solution' }, { status: 500 });
  }
}