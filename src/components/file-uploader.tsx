"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File as FileIcon, X } from "lucide-react";
import { Button } from "./ui/button";

interface FileUploaderProps {
  onUpload: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  accept?: any;
  multiple?: boolean;
  existingFiles?: File[]; // External file list for display
  onRemoveFile?: (file: File) => void; // External remove handler
  showFileList?: boolean; // Whether to show the file list (defaults to true)
}

export function FileUploader({
  onUpload,
  maxFiles = 5,
  maxSize = 30,
  accept = { 
    // Images (all types for OCR and metadata)
    'image/*': [],
    // Documents - PDF
    'application/pdf': [],
    // Documents - Microsoft Office (Legacy)
    'application/msword': [], // .doc
    'application/vnd.ms-excel': [], // .xls
    'application/vnd.ms-powerpoint': [], // .ppt
    // Documents - Microsoft Office (Modern)
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [], // .docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [], // .xlsx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': [], // .pptx
    // Documents - OpenDocument
    'application/vnd.oasis.opendocument.text': [], // .odt
    'application/vnd.oasis.opendocument.spreadsheet': [], // .ods
    'application/vnd.oasis.opendocument.presentation': [], // .odp
    // Text formats
    'text/*': [], // .txt, .csv, .tsv, .md, etc.
    'application/json': [], // .json
    'application/xml': [], // .xml
    'text/xml': [], // .xml
    'text/html': [], // .html
    'text/csv': [], // .csv
    'text/tab-separated-values': [], // .tsv
    'text/markdown': [], // .md
    // Rich Text Format
    'application/rtf': [], // .rtf
    // Audio files (for speech transcription)
    'audio/*': [], // .mp3, .wav, .m4a, .flac, etc.
    // Archives (ZIP files)
    'application/zip': [], // .zip
    'application/x-zip-compressed': [], // .zip
    // Email formats
    'message/rfc822': [], // .eml
    'application/vnd.ms-outlook': [], // .msg
    // Other common formats
    'application/epub+zip': [], // .epub
    'application/x-tar': [], // .tar
    'application/gzip': [], // .gz
  },
  multiple = false,
  existingFiles = [],
  onRemoveFile,
  showFileList = true,
}: FileUploaderProps) {
  // Internal state for backward compatibility when no existingFiles prop is provided
  const [internalFiles, setInternalFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Use existingFiles if provided, otherwise fall back to internal state
  const displayFiles = existingFiles.length > 0 || !showFileList ? existingFiles : internalFiles;
  const isExternallyManaged = existingFiles.length > 0 || onRemoveFile !== undefined;

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      setError(null);
      if (fileRejections.length > 0) {
        setError(fileRejections[0].errors[0].message);
        return;
      }
      
      const currentFileCount = isExternallyManaged ? existingFiles.length : internalFiles.length;
      
      // Check if adding these files would exceed maxFiles
      if (currentFileCount + acceptedFiles.length > maxFiles) {
        setError(`Cannot upload more than ${maxFiles} files total.`);
        return;
      }
      
      if (isExternallyManaged) {
        // New behavior: only pass newly uploaded files
        onUpload(acceptedFiles);
      } else {
        // Legacy behavior: manage files internally and pass all files
        const newFiles = multiple ? [...internalFiles, ...acceptedFiles] : acceptedFiles;
        setInternalFiles(newFiles);
        onUpload(newFiles);
      }
    },
    [existingFiles.length, internalFiles, onUpload, maxFiles, multiple, isExternallyManaged]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize: maxSize * 1024 * 1024,
    maxFiles,
    multiple,
  });
  
  const removeFile = (fileToRemove: File) => {
    if (isExternallyManaged && onRemoveFile) {
      // External management: call the provided remove handler
      onRemoveFile(fileToRemove);
    } else {
      // Internal management: update internal state and call onUpload
      const newFiles = internalFiles.filter(file => file !== fileToRemove);
      setInternalFiles(newFiles);
      onUpload(newFiles);
    }
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`relative p-10 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-300 group overflow-hidden ${
          isDragActive 
            ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20 scale-[1.02]" 
            : "border-gray-300 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600 bg-gray-50/50 dark:bg-gray-900/50 hover:bg-purple-50/50 dark:hover:bg-purple-950/30"
        }`}
      >
        <input {...getInputProps()} />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <UploadCloud className={`mx-auto h-14 w-14 mb-4 transition-all duration-300 ${
          isDragActive 
            ? "text-purple-600 dark:text-purple-400 scale-110" 
            : "text-gray-400 dark:text-gray-600 group-hover:text-purple-500 dark:group-hover:text-purple-400 group-hover:scale-105"
        }`} />
        {isDragActive ? (
          <p className="text-lg font-medium text-purple-600 dark:text-purple-400">Drop your files here!</p>
        ) : (
          <div>
            <p className="text-gray-700 dark:text-gray-300 font-medium">
              Drag & drop files here, or <span className="text-purple-600 dark:text-purple-400">browse</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Supports 40+ formats • Max {maxSize}MB per file
            </p>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {showFileList && displayFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Uploaded Files:</h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {displayFiles.map((file, i) => (
              <li key={i} className="flex items-center justify-between p-2 bg-muted rounded-md text-sm">
                <div className="flex items-center gap-2 truncate">
                   {file.type.startsWith('image/') ? (
                    <img src={URL.createObjectURL(file)} alt={file.name} className="h-8 w-8 object-cover rounded-sm" />
                   ) : (
                    <FileIcon className="h-8 w-8 text-muted-foreground" />
                   )}
                   <span className="truncate">{file.name}</span>
                </div>
                 {(isExternallyManaged ? onRemoveFile : true) && (
                   <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(file)}>
                      <X className="h-4 w-4"/>
                   </Button>
                 )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
