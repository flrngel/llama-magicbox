import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

export interface MarkdownConversionResult {
  success: boolean;
  filename: string;
  file_extension?: string;
  markdown_content?: string;
  title?: string;
  error?: {
    type: string;
    message: string;
    traceback?: string;
  };
}

export interface FileProcessingResult {
  filename: string;
  isImage: boolean;
  content: string; // Either base64 for images or markdown for other files
  originalPath?: string;
}

/**
 * Service to convert files to markdown using Microsoft's markitdown via isolated Python environment
 */
export class MarkitdownService {
  private static readonly PYTHON_SCRIPT_PATH = path.join(
    process.cwd(),
    'third-parties',
    'uv-python-markitdown',
    'convert.py'
  );

  private static readonly UV_PROJECT_PATH = path.join(
    process.cwd(),
    'third-parties',
    'uv-python-markitdown'
  );

  /**
   * Convert a file to markdown using the isolated Python environment
   */
  static async convertToMarkdown(filePath: string): Promise<MarkdownConversionResult> {
    return new Promise((resolve, reject) => {
      // Debug: Log the paths being used
      console.log('Converting file:', filePath);
      console.log('UV project path:', this.UV_PROJECT_PATH);
      console.log('Python script path:', this.PYTHON_SCRIPT_PATH);
      
      // Execute the Python script using uv run with absolute file path
      const process = spawn('uv', ['run', 'python', 'convert.py', path.resolve(filePath)], {
        cwd: this.UV_PROJECT_PATH,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        console.log('markitdown process finished with code:', code);
        console.log('stdout:', stdout);
        console.log('stderr:', stderr);
        
        if (code !== 0) {
          reject(new Error(`markitdown process exited with code ${code}. stderr: ${stderr}`));
          return;
        }

        try {
          const result: MarkdownConversionResult = JSON.parse(stdout);
          resolve(result);
        } catch (parseError) {
          reject(new Error(`Failed to parse markitdown output: ${parseError}. stdout: ${stdout}. stderr: ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Failed to spawn markitdown process: ${error.message}`));
      });

      // Set a timeout to prevent hanging
      setTimeout(() => {
        process.kill('SIGTERM');
        reject(new Error('markitdown process timed out'));
      }, 30000); // 30 second timeout
    });
  }

  /**
   * Check if a file is an image based on its extension
   * Note: Images can be processed by markitdown for OCR, but we handle them separately for visual display
   */
  static isImageFile(filename: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.tif', '.ico'];
    const ext = path.extname(filename).toLowerCase();
    return imageExtensions.includes(ext);
  }

  /**
   * Check if a file is supported by markitdown
   */
  static isSupportedFile(filename: string): boolean {
    const supportedExtensions = [
      // Documents - PDF
      '.pdf',
      // Documents - Microsoft Office (Legacy)
      '.doc', '.xls', '.ppt',
      // Documents - Microsoft Office (Modern) 
      '.docx', '.xlsx', '.pptx',
      // Documents - OpenDocument
      '.odt', '.ods', '.odp',
      // Rich Text Format
      '.rtf',
      // Text formats
      '.txt', '.md', '.markdown', '.csv', '.tsv', '.json', '.xml', '.html', '.htm',
      // Images (for OCR and metadata extraction)
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.tif', '.ico',
      // Audio files (for speech transcription and metadata)
      '.mp3', '.wav', '.m4a', '.flac', '.aac', '.ogg', '.wma',
      // Archives (ZIP files - markitdown iterates over contents)
      '.zip',
      // Email formats
      '.eml', '.msg',
      // E-book formats
      '.epub',
      // Code files (common programming languages)
      '.py', '.js', '.ts', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt',
      // Web files
      '.css', '.scss', '.sass', '.less',
      // Configuration files
      '.yaml', '.yml', '.toml', '.ini', '.conf',
      // Data files
      '.jsonl', '.ndjson',
      // Other archive formats that markitdown might support
      '.tar', '.gz', '.7z', '.rar'
    ];
    
    const ext = path.extname(filename).toLowerCase();
    return supportedExtensions.includes(ext);
  }

  /**
   * Process a file - convert to markdown using markitdown, with special handling for images
   */
  static async processFile(filePath: string): Promise<FileProcessingResult> {
    const filename = path.basename(filePath);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      throw new Error(`File not found: ${filePath}`);
    }

    // Check if it's a supported file type
    if (!this.isSupportedFile(filename)) {
      throw new Error(`Unsupported file type: ${path.extname(filename)}`);
    }

    // For images, we have two options:
    // 1. Return as base64 for visual display (current approach)
    // 2. Use markitdown for OCR text extraction
    
    // Current approach: Images as visual content
    if (this.isImageFile(filename)) {
      const imageBuffer = await fs.readFile(filePath);
      const base64Content = imageBuffer.toString('base64');
      const mimeType = this.getMimeType(filename);
      
      return {
        filename,
        isImage: true,
        content: `data:${mimeType};base64,${base64Content}`,
        originalPath: filePath
      };
    }

    // For all non-image files, use markitdown to convert to markdown
    try {
      const result = await this.convertToMarkdown(filePath);
      
      if (!result.success) {
        throw new Error(`Conversion failed: ${result.error?.message || 'Unknown error'}`);
      }

      // Format the content with filename header
      const markdownContent = `# ${result.title || filename}\n\n${result.markdown_content || ''}`;

      return {
        filename,
        isImage: false,
        content: markdownContent,
        originalPath: filePath
      };
    } catch (error) {
      // If markitdown conversion fails, try to read as plain text (for simple text files)
      console.warn(`Failed to convert ${filename} with markitdown, falling back to plain text:`, error);
      
      try {
        const textContent = await fs.readFile(filePath, 'utf-8');
        return {
          filename,
          isImage: false,
          content: `# ${filename}\n\n\`\`\`\n${textContent}\n\`\`\``,
          originalPath: filePath
        };
      } catch (readError) {
        // If we can't read as text either, the file might be binary or corrupted
        throw new Error(`Failed to process file ${filename}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Get MIME type for an image file
   */
  private static getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Validate that the markitdown service is properly set up
   */
  static async validateSetup(): Promise<boolean> {
    try {
      // Check if the Python script exists
      await fs.access(this.PYTHON_SCRIPT_PATH);
      
      // Check if uv project exists
      await fs.access(path.join(this.UV_PROJECT_PATH, 'pyproject.toml'));
      
      return true;
    } catch {
      return false;
    }
  }
}