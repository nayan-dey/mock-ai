"use client";

import * as React from "react";
import { Camera, Pencil, Loader2, ZoomIn, ZoomOut, Check, X } from "lucide-react";
import { cn } from "../lib/utils";

export interface ImageUploadProps {
  currentImageUrl?: string | null;
  onUpload: (storageId: string) => void;
  onRemove?: () => void;
  generateUploadUrl: () => Promise<string>;
  maxSizeMB?: number;
  shape?: "circle" | "square";
  size?: "sm" | "md" | "lg";
  label?: string;
  disabled?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "h-16 w-16",
  md: "h-24 w-24",
  lg: "h-32 w-32",
};

const cropSizeMap = {
  sm: 160,
  md: 240,
  lg: 280,
};

// ── Crop Dialog ──────────────────────────────────────────────────────

interface CropDialogProps {
  imageUrl: string;
  shape: "circle" | "square";
  cropSize: number;
  onCrop: (blob: Blob) => void;
  onCancel: () => void;
}

function CropDialog({ imageUrl, shape, cropSize, onCrop, onCancel }: CropDialogProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const imgRef = React.useRef<HTMLImageElement | null>(null);

  const [zoom, setZoom] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [dragging, setDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = React.useState(false);

  const viewSize = Math.min(cropSize, 280);

  // Load image
  React.useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);

      // Center the image initially
      const scale = Math.max(viewSize / img.width, viewSize / img.height);
      setZoom(scale);
      setOffset({
        x: (viewSize - img.width * scale) / 2,
        y: (viewSize - img.height * scale) / 2,
      });
    };
    img.src = imageUrl;
  }, [imageUrl, viewSize]);

  // Draw preview on canvas
  React.useEffect(() => {
    if (!imageLoaded || !imgRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = viewSize;
    canvas.height = viewSize;

    ctx.clearRect(0, 0, viewSize, viewSize);

    // Draw the image with current zoom and offset
    ctx.save();
    if (shape === "circle") {
      ctx.beginPath();
      ctx.arc(viewSize / 2, viewSize / 2, viewSize / 2, 0, Math.PI * 2);
      ctx.clip();
    }
    ctx.drawImage(
      imgRef.current,
      offset.x,
      offset.y,
      imgRef.current.width * zoom,
      imgRef.current.height * zoom
    );
    ctx.restore();
  }, [imageLoaded, zoom, offset, viewSize, shape]);

  const minZoom = React.useMemo(() => {
    if (!imgRef.current) return 0.1;
    return Math.max(viewSize / imgRef.current.width, viewSize / imgRef.current.height);
  }, [imageLoaded, viewSize]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || !imgRef.current) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Clamp so image covers the crop area
    const imgW = imgRef.current.width * zoom;
    const imgH = imgRef.current.height * zoom;
    const clampedX = Math.min(0, Math.max(viewSize - imgW, newX));
    const clampedY = Math.min(0, Math.max(viewSize - imgH, newY));

    setOffset({ x: clampedX, y: clampedY });
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  const handleZoomChange = (newZoom: number) => {
    if (!imgRef.current) return;

    const clampedZoom = Math.max(minZoom, Math.min(minZoom * 4, newZoom));

    // Zoom toward center
    const cx = viewSize / 2;
    const cy = viewSize / 2;
    const newX = cx - ((cx - offset.x) / zoom) * clampedZoom;
    const newY = cy - ((cy - offset.y) / zoom) * clampedZoom;

    const imgW = imgRef.current.width * clampedZoom;
    const imgH = imgRef.current.height * clampedZoom;
    const clampedX = Math.min(0, Math.max(viewSize - imgW, newX));
    const clampedY = Math.min(0, Math.max(viewSize - imgH, newY));

    setZoom(clampedZoom);
    setOffset({ x: clampedX, y: clampedY });
  };

  const handleCrop = () => {
    if (!imgRef.current) return;

    // Render the final cropped image at a fixed output size
    const outputSize = 512;
    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = outputSize;
    outputCanvas.height = outputSize;
    const ctx = outputCanvas.getContext("2d");
    if (!ctx) return;

    // Scale the current view to outputSize
    const scale = outputSize / viewSize;
    ctx.drawImage(
      imgRef.current,
      offset.x * scale,
      offset.y * scale,
      imgRef.current.width * zoom * scale,
      imgRef.current.height * zoom * scale
    );

    outputCanvas.toBlob(
      (blob) => {
        if (blob) onCrop(blob);
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="mx-4 w-full max-w-sm rounded-lg border bg-background p-4 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Crop Image</h3>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Crop area */}
        <div
          ref={containerRef}
          className="relative mx-auto overflow-hidden bg-muted"
          style={{
            width: viewSize,
            height: viewSize,
            borderRadius: shape === "circle" ? "9999px" : "8px",
            cursor: dragging ? "grabbing" : "grab",
            touchAction: "none",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <canvas
            ref={canvasRef}
            width={viewSize}
            height={viewSize}
            className="pointer-events-none"
          />
        </div>

        {/* Zoom controls */}
        <div className="mt-3 flex items-center gap-3 px-2">
          <ZoomOut className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="range"
            min={minZoom}
            max={minZoom * 4}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
          />
          <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          Drag to reposition
        </p>

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCrop}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Check className="h-3.5 w-3.5" />
            Crop & Upload
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

export function ImageUpload({
  currentImageUrl,
  onUpload,
  onRemove,
  generateUploadUrl,
  maxSizeMB = 5,
  shape = "square",
  size = "md",
  label,
  disabled = false,
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [cropImageUrl, setCropImageUrl] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const displayUrl = previewUrl || currentImageUrl;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Image must be under ${maxSizeMB}MB`);
      return;
    }

    // Open crop dialog instead of uploading directly
    const objectUrl = URL.createObjectURL(file);
    setCropImageUrl(objectUrl);

    // Reset input so the same file can be re-selected
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleCropComplete = async (blob: Blob) => {
    setCropImageUrl(null);

    // Show cropped preview
    const preview = URL.createObjectURL(blob);
    setPreviewUrl(preview);

    // Upload the cropped blob
    setIsUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "image/jpeg" },
        body: blob,
      });

      if (!result.ok) throw new Error("Upload failed");

      const { storageId } = await result.json();
      onUpload(storageId);
    } catch {
      setError("Upload failed. Please try again.");
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropCancel = () => {
    if (cropImageUrl) URL.revokeObjectURL(cropImageUrl);
    setCropImageUrl(null);
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {label && (
        <span className="text-sm font-medium text-foreground">{label}</span>
      )}
      <div className="relative">
        <button
          type="button"
          disabled={disabled || isUploading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative flex items-center justify-center overflow-hidden border-2 border-dashed border-muted-foreground/30 bg-muted/50 transition-colors hover:border-primary/50 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
            sizeMap[size],
            shape === "circle" ? "rounded-full" : "rounded-lg"
          )}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : displayUrl ? (
            <img
              src={displayUrl}
              alt="Upload preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <Camera className="h-6 w-6 text-muted-foreground" />
          )}
        </button>

        {/* Edit button — bottom-left for circle, bottom-right for square */}
        {displayUrl && !isUploading && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "absolute flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50",
              shape === "circle" ? "-bottom-0.5 -left-0.5" : "-bottom-1 -right-1"
            )}
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && <p className="text-xs text-destructive">{error}</p>}

      {!error && !displayUrl && (
        <p className="text-xs text-muted-foreground">
          PNG, JPG or WebP (max {maxSizeMB}MB)
        </p>
      )}

      {/* Crop dialog */}
      {cropImageUrl && (
        <CropDialog
          imageUrl={cropImageUrl}
          shape={shape}
          cropSize={cropSizeMap[size]}
          onCrop={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}
