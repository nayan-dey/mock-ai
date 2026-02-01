"use client";

import { useCallback, useState } from "react";
import { Upload, X, Image, FileText, FileSpreadsheet } from "lucide-react";
import { Button, Card, cn } from "@repo/ui";

export interface SelectedFile {
  file: File;
  base64: string;
}

interface FileUploaderProps {
  onFilesSelect: (files: SelectedFile[]) => void;
  disabled?: boolean;
}

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "application/vnd.ms-excel", // xls
  "text/csv",
];

const MAX_SIZE = 20 * 1024 * 1024; // 20MB

export function FileUploader({ onFilesSelect, disabled }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `"${file.name}": Invalid file type. Please upload an image (PNG, JPEG, WebP, GIF), PDF, or Excel file.`;
    }
    if (file.size > MAX_SIZE) {
      return `"${file.name}": File too large. Maximum size is 20MB. Your file is ${Math.round(file.size / (1024 * 1024))}MB.`;
    }
    return null;
  };

  const processFiles = useCallback(
    (fileList: FileList) => {
      const newFiles: SelectedFile[] = [];
      const errors: string[] = [];

      const readPromises = Array.from(fileList).map((file) => {
        return new Promise<void>((resolve) => {
          const validationError = validateFile(file);
          if (validationError) {
            errors.push(validationError);
            resolve();
            return;
          }

          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(",")[1];
            newFiles.push({ file, base64 });
            resolve();
          };
          reader.onerror = () => {
            errors.push(`Failed to read "${file.name}".`);
            resolve();
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readPromises).then(() => {
        if (errors.length > 0) {
          setError(errors.join(" "));
        } else {
          setError(null);
        }

        if (newFiles.length > 0) {
          const updated = [...selectedFiles, ...newFiles];
          setSelectedFiles(updated);
          onFilesSelect(updated);
        }
      });
    },
    [selectedFiles, onFilesSelect]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        processFiles(files);
      }
    },
    [disabled, processFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFiles(files);
      }
      // Reset input so selecting the same files again works
      e.target.value = "";
    },
    [processFiles]
  );

  const removeFile = (index: number) => {
    const updated = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updated);
    onFilesSelect(updated);
    if (updated.length === 0) {
      setError(null);
    }
  };

  const getFileIcon = (type: string) => {
    if (type === "application/pdf") {
      return <FileText className="h-6 w-6 text-red-500" />;
    }
    if (type.includes("spreadsheet") || type.includes("excel") || type === "text/csv") {
      return <FileSpreadsheet className="h-6 w-6 text-green-500" />;
    }
    return <Image className="h-6 w-6 text-blue-500" />;
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed p-8 transition-colors",
          dragActive && !disabled
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25",
          disabled && "cursor-not-allowed opacity-50"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,.xlsx,.xls,.csv"
          multiple
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="rounded-full bg-muted p-4">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-medium">
              Drop your files here or click to browse
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Supported: Images, PDF, Excel, CSV (max 20MB each). Select multiple files.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Card className="border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} selected
          </p>
          {selectedFiles.map((sf, index) => (
            <Card key={`${sf.file.name}-${index}`} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {getFileIcon(sf.file.type)}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{sf.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(sf.file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                {!disabled && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    className="h-8 w-8 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
