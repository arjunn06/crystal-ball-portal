"use client";
import { Play } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { VIDEO_ID } from "./config";

const WATCH = `https://www.youtube.com/watch?v=${VIDEO_ID}`;

function preconnect(href: string) {
  if (document.head.querySelector(`link[rel="preconnect"][href="${href}"]`)) return;
  const l = document.createElement("link");
  l.rel = "preconnect";
  l.href = href;
  document.head.appendChild(l);
}

/**
 * Click-to-load YouTube. Nothing from YouTube loads until the visitor taps (apart from the
 * poster image), so the video costs nothing on a slow connection. Without JS the whole card is a
 * normal link to YouTube.
 */
export function VideoFacade({ duration }: { duration?: string }) {
  const [playing, setPlaying] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const [poster, setPoster] = useState(`https://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg`);

  useEffect(() => {
    if (playing) frame.current?.focus();
  }, [playing]);

  const warm = () => {
    preconnect("https://www.youtube-nocookie.com");
    preconnect("https://i.ytimg.com");
  };

  return (
    <div
      className="relative aspect-video overflow-hidden bg-black"
      style={{
        borderRadius: 24,
        boxShadow: "inset 0 0 0 1px hsl(0 0% 100% / 0.08)",
        contain: "layout paint",
      }}
    >
      {playing ? (
        <iframe
          ref={frame}
          className="absolute inset-0 h-full w-full border-0"
          src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&rel=0&playsinline=1`}
          title="The Red Pill program walkthrough"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <a
          href={WATCH}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Play video: The Red Pill program walkthrough"
          className="rp-facade group absolute inset-0 block"
          onClick={(e) => {
            e.preventDefault();
            setPlaying(true);
          }}
          onPointerEnter={warm}
          onTouchStart={warm}
          onFocus={warm}
        >
          <img
            src={poster}
            width={1280}
            height={720}
            alt="Arjun presenting the Red Pill program walkthrough"
            className="absolute inset-0 h-full w-full object-cover"
            decoding="async"
            fetchPriority="low"
            onError={() => setPoster(`https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`)}
          />
          <span className="absolute inset-0 grid place-items-center">
            <span
              className="rp-play grid size-[72px] place-items-center rounded-full bg-white"
              style={{ color: "hsl(220 14% 6%)" }}
            >
              <Play size={28} weight="fill" className="translate-x-0.5" aria-hidden />
            </span>
          </span>
          {duration && (
            <span className="rp-mono absolute bottom-4 right-4 rounded-md bg-black/70 px-2 py-1 text-xs">
              {duration}
            </span>
          )}
        </a>
      )}
    </div>
  );
}
