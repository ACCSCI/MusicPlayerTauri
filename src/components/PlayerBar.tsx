import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { usePlayerStore, FAVORITES_PLAYLIST_ID } from "../stores/usePlayerStore";
import { useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Heart, Download } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import clsx from "clsx";

export default function PlayerBar() {
  const getAssetUrl = (path: string, isOnline?: boolean) => {
    if (isOnline) return path;
    return convertFileSrc(path.replace(/\\/g, "/"));
  };

  const navigate = useNavigate();
  const {
    setIsPlaying,
    currentSong,
    playNext,
    playPrev,
    isPlaying,
    playlists,
    addSongToPlaylist,
    settings,
    convertOnlineToLocal,
    showToast,
  } = usePlayerStore();
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const toggleAudioPlay = async () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (e) {
        console.error("播放失败", e);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) setProgress(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = time;
    setProgress(time);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleDownload = async () => {
    if (!currentSong || !currentSong.isOnline || !currentSong.bvId) return;
    if (!settings.downloadFolder) {
      navigate({ to: '/settings' });
      return;
    }
    setIsDownloading(true);
    try {
      const savedPath = await invoke<string>("download_bilibili_audio", {
        bvId: currentSong.bvId,
        page: currentSong.page || null,
        songName: currentSong.name,
        downloadFolder: settings.downloadFolder,
      });
      await convertOnlineToLocal(currentSong.path, savedPath, currentSong.name);
      showToast("下载成功", "success");
    } catch (e) {
      console.error("下载失败:", e);
      showToast("下载失败", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAddToFavorites = () => {
    if (!currentSong) return;
    addSongToPlaylist(FAVORITES_PLAYLIST_ID, currentSong);
    showToast("已添加到喜欢", "success");
  };

  const isInFavorites = currentSong && playlists.find(p => p.id === FAVORITES_PLAYLIST_ID)?.songs.some(s => s.path === currentSong.path);
  const isOnlineMusic = currentSong?.bvId && !currentSong?.isDownloaded;

  return (
    <div className="bg-base-200 border-t border-base-300 px-4 py-3 pb-20">
      <audio
        ref={audioRef}
        src={currentSong?.bvId && !currentSong?.isDownloaded ? undefined : (currentSong ? getAssetUrl(currentSong.path, false) : undefined)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={playNext}
        onError={(e) => { console.error("音频加载失败:", e); setIsPlaying(false); }}
      />

      {/* 进度条 */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-base-content/60 w-8">{formatTime(progress)}</span>
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={progress}
          onChange={handleSeek}
          className="flex-1 h-1.5 bg-base-300 rounded-full appearance-none cursor-pointer 
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
          style={{ background: `linear-gradient(to right, oklch(var(--p)) ${(progress / (duration || 1)) * 100}%, oklch(var(--b3)) ${(progress / (duration || 1)) * 100}%)` }}
        />
        <span className="text-xs text-base-content/60 w-8 text-right">{formatTime(duration)}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* 歌曲信息 */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center shrink-0">
            <span className="text-white text-lg">♪</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-sm truncate">{currentSong?.name || "未播放音乐"}</span>
            <span className="text-xs text-base-content/60">{isOnlineMusic ? "在线" : "本地"}</span>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost btn-circle btn-sm" onClick={playPrev}>
            <SkipBack size={20} />
          </button>
          <button 
            className="btn btn-circle w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 text-white"
            onClick={toggleAudioPlay}
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
          </button>
          <button className="btn btn-ghost btn-circle btn-sm" onClick={playNext}>
            <SkipForward size={20} />
          </button>
        </div>

        {/* 右侧操作 */}
        <div className="flex items-center gap-1">
          <button 
            className={clsx(
              "btn btn-ghost btn-circle btn-sm",
              isInFavorites ? "text-pink-500" : ""
            )} 
            onClick={handleAddToFavorites}
          >
            <Heart size={18} fill={isInFavorites ? "currentColor" : "none"} />
          </button>
          {(currentSong?.bvId || currentSong?.isDownloaded) && (
            <button 
              className={clsx(
                "btn btn-ghost btn-circle btn-sm",
                currentSong?.isDownloaded ? "text-green-500" : ""
              )} 
              onClick={handleDownload}
              disabled={isDownloading || currentSong?.isDownloaded}
            >
              <Download size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}