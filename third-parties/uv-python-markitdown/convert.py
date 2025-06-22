#!/usr/bin/env python3
"""
File to Markdown converter using Microsoft's markitdown.
Accepts file path as argument and outputs markdown content to stdout.
"""

import sys
import json
import traceback
from pathlib import Path
from markitdown import MarkItDown

def convert_file_to_markdown(file_path: str) -> dict:
    """
    Convert a file to markdown using markitdown.
    
    Args:
        file_path: Path to the file to convert
        
    Returns:
        dict: Result containing success status, markdown content, and metadata
    """
    try:
        # Initialize MarkItDown
        md = MarkItDown()
        
        # Convert file to markdown
        result = md.convert(file_path)
        
        # Get file info
        file_info = Path(file_path)
        
        return {
            "success": True,
            "filename": file_info.name,
            "file_extension": file_info.suffix,
            "markdown_content": result.text_content,
            "title": result.title or file_info.stem,
            "error": None
        }
        
    except Exception as e:
        return {
            "success": False,
            "filename": Path(file_path).name if file_path else "unknown",
            "file_extension": Path(file_path).suffix if file_path else "",
            "markdown_content": None,
            "title": None,
            "error": {
                "type": type(e).__name__,
                "message": str(e),
                "traceback": traceback.format_exc()
            }
        }

def main():
    """Main entry point for the script."""
    if len(sys.argv) != 2:
        error_result = {
            "success": False,
            "error": {
                "type": "ArgumentError",
                "message": "Usage: python convert.py <file_path>",
                "traceback": None
            }
        }
        print(json.dumps(error_result))
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    # Check if file exists
    if not Path(file_path).exists():
        error_result = {
            "success": False,
            "filename": Path(file_path).name,
            "error": {
                "type": "FileNotFoundError",
                "message": f"File not found: {file_path}",
                "traceback": None
            }
        }
        print(json.dumps(error_result))
        sys.exit(1)
    
    # Convert file and output JSON result
    result = convert_file_to_markdown(file_path)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()