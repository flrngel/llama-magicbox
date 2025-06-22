import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { MarkitdownService } from '@/lib/markitdown-service';

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Create temp directory if it doesn't exist
    const tempDir = join(process.cwd(), 'temp');
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }

    // Save file temporarily
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempFilePath = join(tempDir, `upload-${Date.now()}-${file.name}`);
    await writeFile(tempFilePath, buffer);

    try {
      // Process file with markitdown service
      const result = await MarkitdownService.processFile(tempFilePath);
      
      // Clean up temporary file
      await unlink(tempFilePath);
      
      return NextResponse.json({
        success: true,
        filename: result.filename,
        isImage: result.isImage,
        content: result.content,
        originalPath: result.originalPath
      });
      
    } catch (processingError) {
      // Clean up temporary file even if processing fails
      try {
        await unlink(tempFilePath);
      } catch (unlinkError) {
        console.error('Failed to cleanup temp file:', unlinkError);
      }
      
      throw processingError;
    }
    
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process file',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// Validate markitdown setup on startup
export async function GET() {
  try {
    const isSetupValid = await MarkitdownService.validateSetup();
    
    if (isSetupValid) {
      return NextResponse.json({ 
        status: 'ready',
        message: 'Markitdown service is properly configured'
      });
    } else {
      return NextResponse.json({ 
        status: 'error',
        message: 'Markitdown service is not properly configured'
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      message: 'Failed to validate markitdown setup',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}