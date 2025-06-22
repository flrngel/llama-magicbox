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
  maxSize = 10,
  accept = { 'image/jpeg': [], 'image/png': [], 'application/pdf': [], 'text/plain': [], 'text/csv': [] },
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
        className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        {isDragActive ? (
          <p className="text-primary">Drop the files here ...</p>
        ) : (
          <p>Drag & drop some files here, or click to select files</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Supported: PDF, JPG, PNG, TXT, CSV. Max {maxSize}MB per file.
        </p>
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
