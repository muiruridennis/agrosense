"use client";

import { useState, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
}

export function VideoPlayer({
  src,
  poster,
  className,
  autoPlay = false,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress =
        (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
      setDuration(videoRef.current.duration);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = x * videoRef.current.duration;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={cn(
        "relative group aspect-video rounded-lg overflow-hidden bg-black",
        className,
      )}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted={isMuted}
        autoPlay={autoPlay}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
          }
        }}
        playsInline
      />

      {/* Play/Pause Overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
        <button
          onClick={togglePlay}
          className="rounded-full bg-white/20 backdrop-blur-sm p-4 hover:bg-white/30 transition-all hover:scale-110"
        >
          {isPlaying ? (
            <Pause className="h-8 w-8 text-white" />
          ) : (
            <Play className="h-8 w-8 text-white" />
          )}
        </button>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="text-white/80 hover:text-white"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>

          <div
            className="flex-1 h-1 bg-white/30 rounded-full cursor-pointer"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-white/80 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <span className="text-[10px] text-white/60 font-mono">
            {formatTime(videoRef.current?.currentTime || 0)} /{" "}
            {formatTime(duration)}
          </span>

          <button
            onClick={toggleMute}
            className="text-white/80 hover:text-white"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>

          <button
            onClick={() => {
              if (videoRef.current) {
                if (videoRef.current.requestFullscreen) {
                  videoRef.current.requestFullscreen();
                }
              }
            }}
            className="text-white/80 hover:text-white"
          >
            <Maximize className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Play Button (visible when paused) */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="rounded-full bg-white/20 backdrop-blur-sm p-5">
            <Play className="h-10 w-10 text-white fill-white" />
          </div>
        </div>
      )}
    </div>
  );
}
