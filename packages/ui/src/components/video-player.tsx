"use client";

import * as React from "react";
import ReactPlayer from "react-player";
import { cn } from "../lib/utils";
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from "lucide-react";
import { Button } from "./button";
import { Progress } from "./progress";

interface VideoPlayerProps {
  url: string;
  title?: string;
  onProgress?: (progress: { played: number; playedSeconds: number }) => void;
  className?: string;
}

export function VideoPlayer({
  url,
  title,
  onProgress,
  className,
}: VideoPlayerProps) {
  const playerRef = React.useRef<ReactPlayer>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [played, setPlayed] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [seeking, setSeeking] = React.useState(false);

  const handlePlayPause = () => setPlaying(!playing);
  const handleMute = () => setMuted(!muted);

  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    if (!seeking) {
      setPlayed(state.played * 100);
    }
    onProgress?.(state);
  };

  const handleDuration = (duration: number) => {
    setDuration(duration);
  };

  const handleSeekChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    setPlayed(pos * 100);
    playerRef.current?.seekTo(pos);
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  const handleRestart = () => {
    playerRef.current?.seekTo(0);
    setPlaying(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative overflow-hidden rounded-lg bg-black",
        className
      )}
    >
      <ReactPlayer
        ref={playerRef}
        url={url}
        width="100%"
        height="100%"
        playing={playing}
        muted={muted}
        onProgress={handleProgress}
        onDuration={handleDuration}
        style={{ aspectRatio: "16/9" }}
      />

      {/* Title overlay */}
      {title && (
        <div className="absolute left-0 right-0 top-0 bg-gradient-to-b from-black/70 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
      )}

      {/* Controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
        {/* Progress bar */}
        <div
          className="mb-3 cursor-pointer"
          onClick={handleSeekChange}
          onMouseDown={() => setSeeking(true)}
          onMouseUp={() => setSeeking(false)}
        >
          <Progress value={played} className="h-1.5" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={handlePlayPause}
            >
              {playing ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={handleRestart}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={handleMute}
            >
              {muted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>

            <span className="ml-2 text-sm text-white">
              {formatTime((played / 100) * duration)} / {formatTime(duration)}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={handleFullscreen}
          >
            <Maximize className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Play button overlay when paused */}
      {!playing && (
        <div
          className="absolute inset-0 flex cursor-pointer items-center justify-center"
          onClick={handlePlayPause}
        >
          <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
            <Play className="h-12 w-12 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}
