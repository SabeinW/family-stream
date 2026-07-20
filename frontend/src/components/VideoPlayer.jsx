import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, Volume2, VolumeX, RotateCcw, RotateCw,
  Maximize, Minimize, ArrowLeft, Settings, X, Download, Share2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import DeleteMediaButton from './DeleteMediaButton.jsx';

function formatTime(sec) {
  if (!Number.isFinite(sec)) return '0:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const mm = h ? String(m).padStart(2, '0') : m;
  return h ? `${h}:${mm}:${String(s).padStart(2, '0')}` : `${mm}:${String(s).padStart(2, '0')}`;
}

export default function VideoPlayer({ media, startAt = 0, onTheaterChange, isOwner = false, onDeleted, onShareClick }) {
  const videoRef = useRef(null);
  const wrapperRef = useRef(null);
  const controlsTimeout = useRef(null);
  const navigate = useNavigate();

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(startAt);
  const [duration, setDuration] = useState(media.durationSec || 0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [theater, setTheater] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showQuality, setShowQuality] = useState(false);
  const [quality, setQuality] = useState('Auto');
  const [buffered, setBuffered] = useState(0);
  const resumeRef = useRef({ time: 0, playing: false });

  // "Auto" = the default/highest rendition the backend already picked.
  const qualityOptions = ['Auto', ...(media.renditions || []).map((r) => r.quality)];

  const changeQuality = (q) => {
    if (q === quality) return setShowQuality(false);
    const v = videoRef.current;
    resumeRef.current = { time: v?.currentTime || 0, playing: v && !v.paused };
    setQuality(q);
    setShowQuality(false);
  };

  // Re-point the <video> src whenever quality changes, restoring position/playback.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onLoaded = () => {
      v.currentTime = resumeRef.current.time;
      if (resumeRef.current.playing) v.play();
    };
    v.addEventListener('loadedmetadata', onLoaded, { once: true });
    return () => v.removeEventListener('loadedmetadata', onLoaded);
  }, [quality]);

  useEffect(() => () => onTheaterChange?.(false), [onTheaterChange]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  }, []);

  const skip = (delta) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(v.currentTime + delta, 0), duration);
  };

  const onSeek = (e) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    v.currentTime = (Number(e.target.value) / 1000) * duration;
  };

  const onVolume = (e) => {
    const v = videoRef.current;
    const val = Number(e.target.value) / 100;
    setVolume(val);
    setMuted(val === 0);
    if (v) v.volume = val;
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const toggleTheater = () => {
    setTheater((t) => {
      onTheaterChange?.(!t);
      return !t;
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  };

  // Auto-hide controls after inactivity
  const bumpControls = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => playing && setShowControls(false), 2800);
  }, [playing]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = startAt;

    const onTime = () => setCurrent(v.currentTime);
    const onLoaded = () => setDuration(v.duration);
    const onProgress = () => {
      if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1));
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('progress', onProgress);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onLoaded);
      v.removeEventListener('progress', onProgress);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
    };
  }, [startAt]);

  // Periodically persist watch progress
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        api.saveProgress(media.id, videoRef.current.currentTime).catch(() => {});
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [media.id]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      if (e.code === 'ArrowRight') skip(10);
      if (e.code === 'ArrowLeft') skip(-10);
      if (e.code === 'KeyF') toggleFullscreen();
      if (e.code === 'KeyM') toggleMute();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay]);

  const seekPct = duration ? (current / duration) * 1000 : 0;
  const bufferedPct = duration ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={wrapperRef}
      onMouseMove={bumpControls}
      onClick={bumpControls}
      className={`relative bg-black overflow-hidden ${theater ? 'w-full h-[80vh]' : 'aspect-video w-full'} rounded-lg group`}
    >
      <video
        ref={videoRef}
        src={api.streamUrl(media.id, quality)}
        className="w-full h-full object-contain bg-black"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        autoPlay
        playsInline
      />

      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/50 flex flex-col justify-between"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/10 shrink-0">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="font-semibold text-sm md:text-base truncate">{media.title}</h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={api.downloadUrl(media.id)}
                  download
                  aria-label="Download"
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <Download className="w-5 h-5" />
                </a>
                {isOwner && (
                  <>
                    <button onClick={onShareClick} aria-label="Share" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                    <DeleteMediaButton mediaId={media.id} onDeleted={onDeleted} />
                  </>
                )}
                {theater && (
                  <button
                    onClick={toggleTheater}
                    className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide bg-white/10 hover:bg-white/20 px-3 py-2 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" /> Exit Theater
                  </button>
                )}
              </div>
            </div>

            {/* Center play/pause + skip */}
            <div className="flex items-center justify-center gap-10">
              <button onClick={() => skip(-10)} className="p-3 hover:scale-110 transition-transform" aria-label="Rewind 10 seconds">
                <RotateCcw className="w-7 h-7" />
              </button>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={togglePlay}
                className="p-5 rounded-full bg-white/15 backdrop-blur hover:bg-white/25 transition-colors"
              >
                {playing ? <Pause className="w-8 h-8 fill-white" /> : <Play className="w-8 h-8 fill-white" />}
              </motion.button>
              <button onClick={() => skip(10)} className="p-3 hover:scale-110 transition-transform" aria-label="Forward 10 seconds">
                <RotateCw className="w-7 h-7" />
              </button>
            </div>

            {/* Bottom bar */}
            <div className="p-4 space-y-2">
              <div className="relative h-1 rounded-full bg-white/20">
                <div className="absolute h-full bg-white/30 rounded-full" style={{ width: `${bufferedPct}%` }} />
                <input
                  type="range"
                  min={0}
                  max={1000}
                  value={seekPct}
                  onChange={onSeek}
                  className="player-range absolute inset-0 w-full"
                  style={{ '--fill': `${seekPct / 10}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-white/80">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button onClick={togglePlay}>{playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</button>
                  <button onClick={toggleMute}>{muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}</button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={muted ? 0 : volume * 100}
                    onChange={onVolume}
                    className="player-range w-20 hidden sm:block"
                    style={{ '--fill': `${muted ? 0 : volume * 100}%` }}
                  />
                  <span className="whitespace-nowrap">{formatTime(current)} / {formatTime(duration)}</span>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 relative">
                  <button onClick={() => setShowQuality((s) => !s)} className="flex items-center gap-1">
                    <Settings className="w-4 h-4" /> {quality}
                  </button>
                  {showQuality && (
                    <div className="absolute bottom-6 right-0 bg-base-800 rounded-md shadow-card ring-1 ring-white/10 overflow-hidden">
                      {qualityOptions.map((q) => (
                        <button
                          key={q}
                          onClick={() => changeQuality(q)}
                          className={`block w-full text-left px-4 py-2 text-xs hover:bg-white/10 ${q === quality ? 'text-accent' : ''}`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={toggleTheater}
                    className={`text-[10px] uppercase tracking-wide font-semibold border rounded px-2 py-1 transition-colors ${
                      theater ? 'bg-white text-black border-white' : 'border-white/30'
                    }`}
                  >
                    Theater
                  </button>
                  <button onClick={toggleFullscreen}>
                    {fullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
