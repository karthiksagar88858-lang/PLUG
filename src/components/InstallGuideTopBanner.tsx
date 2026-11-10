import React, { useState, useRef, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  X,
  Download,
  PowerOff,
  Sparkles,
} from 'lucide-react';

const VIDEO_SRC = '/assets/aistudio/lv_0_20261028165419_23d89e4b.mp4';
const STORAGE_KEY = 'plug_install_video_permanently_dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallGuideTopBanner: React.FC = () => {
  // Video pops up every time whenever the user opens the app
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    // Clear any previous permanent block so the video always pops up on app open
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Check standalone mode and capture PWA install prompt
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        // @ts-expect-error iOS Safari standalone check
        window.navigator.standalone === true;
      if (isStandalone) {
        setIsInstalled(true);
      }

      const handleInstallPrompt = (e: Event) => {
        e.preventDefault();
        setInstallPrompt(e as BeforeInstallPromptEvent);
      };

      window.addEventListener('beforeinstallprompt', handleInstallPrompt);
      return () => {
        window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      };
    }
  }, []);

  // Attempt automatic playback with audio immediately on mount
  useEffect(() => {
    if (isDismissed || isVideoOff) return;

    const video = videoRef.current;
    if (!video) return;

    // Try unmuted audio autoplay first as requested
    video.muted = false;
    video.volume = 1.0;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setIsMuted(false);
        })
        .catch(() => {
          // If browser policy blocks sound before user gesture, play muted automatically
          // and listen for first touch/click anywhere on the page to unmute smoothly
          video.muted = true;
          setIsMuted(true);
          video
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        });
    }

    // Automatically enable audio on first user touch or interaction anywhere
    const enableAudioOnFirstGesture = () => {
      if (videoRef.current && videoRef.current.muted) {
        videoRef.current.muted = false;
        videoRef.current.volume = 1.0;
        setIsMuted(false);
      }
      window.removeEventListener('click', enableAudioOnFirstGesture);
      window.removeEventListener('touchstart', enableAudioOnFirstGesture);
    };

    window.addEventListener('click', enableAudioOnFirstGesture, { once: true });
    window.addEventListener('touchstart', enableAudioOnFirstGesture, { once: true });

    return () => {
      window.removeEventListener('click', enableAudioOnFirstGesture);
      window.removeEventListener('touchstart', enableAudioOnFirstGesture);
    };
  }, [isDismissed, isVideoOff]);

  // Dismiss video for current session (pops up fresh whenever user opens the app)
  const handleDismiss = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsDismissed(true);
  };

  // Toggle video playback on / off
  const handleToggleVideoOff = () => {
    if (videoRef.current) {
      if (!isVideoOff) {
        videoRef.current.pause();
        setIsPlaying(false);
        setIsVideoOff(true);
      } else {
        setIsVideoOff(false);
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    } else {
      setIsVideoOff(!isVideoOff);
    }
  };

  // Toggle sound
  const handleToggleSound = () => {
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      if (!nextMuted) {
        videoRef.current.volume = 1.0;
      }
      setIsMuted(nextMuted);
    }
  };

  // Toggle play / pause
  const handleTogglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleInstallClick = async () => {
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setInstallPrompt(null);
        }
      } catch (err) {
        console.error('Install prompt error:', err);
      }
    } else {
      alert('To install: Tap the 3-dot menu (⋮) in Chrome and select "Install app".');
    }
  };

  // If user clicked the cross bar, it disappeared permanently
  if (isDismissed) {
    return null;
  }

  return (
    <div
      className="w-full bg-slate-950 text-white border-b border-amber-500/30 shadow-xl overflow-hidden relative"
      aria-label="App Installation Video Guide"
    >
      {/* Top Cross Bar / Header */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
            How to Install PLUG App
          </span>
          <span className="text-[9px] bg-amber-500/20 text-amber-300 font-semibold px-1.5 py-0.5 rounded">
            Vertical Guide
          </span>
        </div>

        {/* Cross Bar Button at the very top of video */}
        <button
          onClick={handleDismiss}
          className="flex items-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-red-900/60 hover:border-red-500/50 border border-slate-700 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
          title="Close installation guide video"
          aria-label="Close installation video guide"
        >
          <span>Dismiss</span>
          <X className="w-3.5 h-3.5 text-red-400" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="p-3 flex flex-col items-center">
        {isVideoOff ? (
          /* Video is Turned Off State */
          <div className="w-full max-w-[240px] aspect-[9/16] bg-slate-900/90 rounded-2xl border border-slate-800 flex flex-col items-center justify-center p-4 text-center my-2 shadow-inner">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
              <PowerOff className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-200 mb-1">Video is Turned Off</p>
            <p className="text-[10px] text-slate-400 mb-3">
              Tap below to turn the video back on anytime.
            </p>
            <button
              onClick={handleToggleVideoOff}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>Turn On Video</span>
            </button>
          </div>
        ) : (
          /* YouTube Shorts Style Vertical Video Box */
          <div className="relative w-full max-w-[220px] aspect-[9/16] rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-black group my-1">
            <video
              ref={videoRef}
              src={VIDEO_SRC}
              autoPlay
              playsInline
              loop
              className="w-full h-full object-cover"
              onClick={handleTogglePlay}
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

            {/* Top Badge Overlay */}
            <div className="absolute top-2 left-2 pointer-events-none">
              <div className="bg-black/60 backdrop-blur-xs text-[9px] font-bold text-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-500/30">
                <Sparkles className="w-2.5 h-2.5" />
                <span>14s Install Guide</span>
              </div>
            </div>

            {/* Play/Pause Center Indicator on Click */}
            {!isPlaying && (
              <div
                onClick={handleTogglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-amber-500/90 text-slate-950 flex items-center justify-center shadow-lg transition-transform hover:scale-105">
                  <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
                </div>
              </div>
            )}

            {/* Video Controls Bottom Bar (Inside Vertical Box) */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white pointer-events-auto">
              {/* Play/Pause */}
              <button
                onClick={handleTogglePlay}
                className="w-7 h-7 rounded-full bg-black/70 hover:bg-black flex items-center justify-center backdrop-blur-xs border border-white/20 transition-transform active:scale-95"
                aria-label={isPlaying ? 'Pause video' : 'Play video'}
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-white" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                )}
              </button>

              {/* Volume Button: Shows Volume On / Muted */}
              <button
                onClick={handleToggleSound}
                className={`px-2 py-1 rounded-full flex items-center gap-1 text-[10px] font-bold backdrop-blur-xs transition-colors border ${
                  isMuted
                    ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                    : 'bg-black/70 text-white border-white/20'
                }`}
                title={isMuted ? 'Turn volume ON' : 'Turn volume OFF'}
                aria-label={isMuted ? 'Turn volume ON' : 'Turn volume OFF'}
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span className="text-[9px]">Tap Sound</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span className="text-[9px]">Audio On</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Action Controls Below the Vertical Box */}
        <div className="w-full max-w-[280px] flex items-center justify-between gap-2 mt-2">
          {/* Turn Off Video Option */}
          <button
            onClick={handleToggleVideoOff}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold py-1.5 px-2.5 rounded-lg border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
          >
            <PowerOff className="w-3 h-3 text-red-400" />
            <span>{isVideoOff ? 'Turn Video On' : 'Turn Off Video'}</span>
          </button>

          {/* Quick Install Action */}
          <button
            onClick={handleInstallClick}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold py-1.5 px-2.5 rounded-lg shadow flex items-center justify-center gap-1.5 transition-transform active:scale-98"
          >
            <Download className="w-3 h-3 stroke-[2.5]" />
            <span>{isInstalled ? 'Installed ✓' : 'Install App'}</span>
          </button>
        </div>

        {/* Guide note */}
        <p className="text-[10px] text-slate-400 text-center mt-1.5">
          Tap <strong className="text-slate-200">Dismiss [X]</strong> above to close anytime. Pops up when opening the app.
        </p>
      </div>
    </div>
  );
};
