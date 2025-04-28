"use client";

import { RefObject } from "react";

type VideoCardProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  label: string;
  muted?: boolean;
};

export default function VideoCard({
  videoRef,
  label,
  muted = false,
}: VideoCardProps) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-gray-300 shadow-md">
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className="h-full w-full object-cover"
        />
        <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white shadow md:text-sm">
          {label}
        </div>
      </div>
    </div>
  );
}
