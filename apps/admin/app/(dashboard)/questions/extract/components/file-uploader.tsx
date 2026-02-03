"use client";

import { useCallback, useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload,
  X,
  Image as ImageIcon,
  FileText,
  FileSpreadsheet,
  Camera,
  Table2,
  Eye,
  Plus,
} from "lucide-react";
import {
  Card,
  cn,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Badge,
} from "@repo/ui";

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
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
];

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_SIZE = 20 * 1024 * 1024; // 20MB

export function FileUploader({ onFilesSelect, disabled }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<SelectedFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  const thumbnailUrls = useMemo(() => {
    const urls = new Map<number, string>();
    selectedFiles.forEach((sf, i) => {
      if (IMAGE_TYPES.includes(sf.file.type)) {
        urls.set(i, URL.createObjectURL(sf.file));
      }
    });
    return urls;
  }, [selectedFiles]);

  // Cleanup object URLs on change or unmount to prevent memory leaks
  const prevUrlsRef = useRef<Map<number, string>>(new Map());
  useEffect(() => {
    // Revoke old URLs that are no longer in the new map
    prevUrlsRef.current.forEach((url, key) => {
      if (!thumbnailUrls.has(key) || thumbnailUrls.get(key) !== url) {
        URL.revokeObjectURL(url);
      }
    });
    prevUrlsRef.current = new Map(thumbnailUrls);

    return () => {
      thumbnailUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [thumbnailUrls]);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `"${file.name}": Unsupported file type. Use images, PDF, or Excel.`;
    }
    if (file.size > MAX_SIZE) {
      return `"${file.name}": Too large (${Math.round(file.size / (1024 * 1024))}MB). Max 20MB.`;
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
        setError(errors.length > 0 ? errors.join(" ") : null);
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
      if (files && files.length > 0) processFiles(files);
    },
    [disabled, processFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) processFiles(files);
      e.target.value = "";
    },
    [processFiles]
  );

  const removeFile = (index: number) => {
    const url = thumbnailUrls.get(index);
    if (url) URL.revokeObjectURL(url);
    const updated = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updated);
    onFilesSelect(updated);
    if (updated.length === 0) setError(null);
  };

  const getFileIcon = (type: string) => {
    if (type === "application/pdf") return <FileText className="h-5 w-5 text-red-500" />;
    if (type.includes("spreadsheet") || type.includes("excel") || type === "text/csv")
      return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
    return <ImageIcon className="h-5 w-5 text-blue-500" />;
  };

  // Manage preview URL lifecycle to avoid inline createObjectURL in render
  useEffect(() => {
    if (previewFile) {
      const url = URL.createObjectURL(previewFile.file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [previewFile]);

  const isImageFile = (type: string) => IMAGE_TYPES.includes(type);

  const hasFiles = selectedFiles.length > 0;

  return (
    <div className="space-y-3">
      {/* File thumbnails — shown above the drop zone */}
      <AnimatePresence>
        {hasFiles && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-wrap gap-2 items-end"
          >
            {selectedFiles.map((sf, index) => (
              <motion.div
                key={`${sf.file.name}-${index}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="relative group"
              >
                {isImageFile(sf.file.type) && thumbnailUrls.has(index) ? (
                  /* Image thumbnail */
                  <button
                    type="button"
                    onClick={() => setPreviewFile(sf)}
                    className="relative block overflow-hidden rounded-xl"
                  >
                    <img
                      src={thumbnailUrls.get(index)}
                      alt={sf.file.name}
                      className="h-24 w-24 rounded-xl object-cover"
                    />
                    {/* Hover overlay with eye */}
                    <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ) : (
                  /* Non-image file chip */
                  <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2 h-24">
                    {getFileIcon(sf.file.type)}
                    <div className="min-w-0 max-w-[120px]">
                      <p className="text-xs font-medium truncate">{sf.file.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {(sf.file.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                )}

                {/* X button */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute -top-1.5 -right-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-foreground/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </motion.div>
            ))}

            {/* Add more button */}
            <div>
              <input
                ref={addMoreInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,.xlsx,.xls,.csv"
                multiple
                onChange={handleFileInput}
                disabled={disabled}
                className="hidden"
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() => addMoreInputRef.current?.click()}
                className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 text-muted-foreground/50 hover:border-muted-foreground/40 hover:text-muted-foreground/70 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drop zone — always visible but smaller when files exist */}
      <AnimatePresence mode="wait">
        {!hasFiles && (
          <motion.div
            key="dropzone-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              animate={dragActive && !disabled ? { scale: 1.01 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div
                className={cn(
                  "relative rounded-xl border-2 border-dashed p-8 transition-all duration-200",
                  dragActive && !disabled
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-muted-foreground/20 hover:border-muted-foreground/40",
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
                  <div className="rounded-full bg-muted/80 p-3">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium">
                      Drop files here or click to browse
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      <Badge variant="secondary" className="gap-1 text-[10px] font-normal px-2 py-0.5">
                        <Camera className="h-2.5 w-2.5" />
                        Images
                      </Badge>
                      <Badge variant="secondary" className="gap-1 text-[10px] font-normal px-2 py-0.5">
                        <FileText className="h-2.5 w-2.5" />
                        PDF
                      </Badge>
                      <Badge variant="secondary" className="gap-1 text-[10px] font-normal px-2 py-0.5">
                        <Table2 className="h-2.5 w-2.5" />
                        Excel / CSV
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground/60">
                      Max 20MB per file
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-destructive/50 bg-destructive/5 p-3">
              <p className="text-xs text-destructive">{error}</p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium truncate">
              {previewFile?.file.name}
            </DialogTitle>
          </DialogHeader>
          {previewFile && previewUrl && (
            <div className="flex items-center justify-center">
              <img
                src={previewUrl}
                alt={previewFile.file.name}
                className="max-h-[70vh] w-auto rounded-lg object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
