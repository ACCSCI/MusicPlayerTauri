import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { usePlayerStore, FAVORITES_PLAYLIST_ID } from "../stores/usePlayerStore";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, Plus, ListMusic, List, X, Download } from "lucide-react";
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
    volume,
    setVolume,
    currentSong,
    playNext,
    playPrev,
    isPlaying,
    playlists,
    addSongToPlaylist,
    playQueue,
    playSong,
    settings,
    convertOnlineToLocal,
    showToast,
    toast,
    removeFromPlayQueue,
  } = usePlayerStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showPlayQueue, setShowPlayQueue] = useState(false);
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

  const setAudioVolumn = (value: number) => {
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value / 100;
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

  useEffect(() => {
    const loadAndPlaySong = async () => {
      if (!currentSong || !audioRef.current) return;
      try {
        if (currentSong.isOnline && currentSong.bvId) {
          const bytes = await invoke<number[]>("get_bilibili_audio_stream", { 
            bvId: currentSong.bvId,
            page: currentSong.page || null
          });
          const uint8Array = new Uint8Array(bytes);
          const blob = new Blob([uint8Array], { type: "audio/mp4" });
          const blobUrl = URL.createObjectURL(blob);
          audioRef.current.src = blobUrl;
        } else {
          audioRef.current.src = getAssetUrl(currentSong.path, false);
        }
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (e) {
        console.error("音频加载失败", e);
        setIsPlaying(false);
      }
    };
    loadAndPlaySong();
  }, [currentSong]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? "0" + sec : sec}`;
  };

  const handleAddToFavorites = () => {
    if (!currentSong) return;
    addSongToPlaylist(FAVORITES_PLAYLIST_ID, currentSong);
  };

  const handleAddToPlaylist = (playlistId: string) => {
    if (!currentSong) return;
    addSongToPlaylist(playlistId, currentSong);
    setShowPlaylistModal(false);
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

  const userPlaylists = playlists.filter(p => p.id !== "local" && !p.songs.some(s => s.path === currentSong?.path));
  const isInFavorites = currentSong && playlists.find(p => p.id === FAVORITES_PLAYLIST_ID)?.songs.some(s => s.path === currentSong.path);
  const isOnlineMusic = currentSong?.isOnline === true;

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl">
      <div className="h-24 rounded-3xl overflow-hidden bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-white/30 dark:border-white/10 shadow-2xl shadow-black/20 ring-1 ring-black/5">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        
        <audio
          ref={audioRef}
          src={currentSong?.bvId ? undefined : (currentSong ? getAssetUrl(currentSong.path, currentSong.isOnline) : undefined)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={playNext}
          onError={(e) => { console.error("音频加载失败:", e); setIsPlaying(false); }}
        />

        <div className="h-full flex flex-col justify-center px-8">
          {/* 进度条 */}
          <div className="w-full flex items-center gap-3 mb-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right tabular-nums shrink-0">{formatTime(progress)}</span>
            <div className="flex-1 relative group">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={progress}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-300/50 dark:bg-gray-700/50 rounded-full appearance-none cursor-pointer 
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-pink-500 [&::-webkit-slider-thumb]:to-purple-600
                  [&::-webkit-slider-thumb]:opacity-0 [&::-webkit-slider-thumb]:group-hover:opacity-100
                  [&::-webkit-slider-thumb]:transition-opacity [&::-webkit-slider-thumb]:shadow-md"
                style={{ background: `linear-gradient(to right, rgb(236,72,153) ${(progress / (duration || 1)) * 100}%, rgb(209,213,219) ${(progress / (duration || 1)) * 100}%)` }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 w-10 tabular-nums shrink-0">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center justify-between">
            {/* 歌曲信息 */}
            <div className="flex items-center gap-3 w-56 flex-shrink-0">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center overflow-hidden shadow-lg">
                  <span className="text-white text-lg">♪</span>
                </div>
                {isPlaying && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sm truncate dark:text-white">{currentSong?.name || "未播放音乐"}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{isOnlineMusic ? "在线音乐" : "本地音乐"}</span>
              </div>
            </div>

            {/* 中间控制区 */}
            <div className="flex items-center gap-4">
              <button className="btn btn-ghost btn-circle btn-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10" onClick={playPrev}>
                <SkipBack size={20} />
              </button>
              <button className="btn btn-circle w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:scale-105 hover:shadow-lg hover:shadow-pink-500/30 transition-all duration-200" onClick={toggleAudioPlay}>
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
              </button>
              <button className="btn btn-ghost btn-circle btn-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10" onClick={playNext}>
                <SkipForward size={20} />
              </button>
            </div>

            {/* 右侧操作区 */}
            <div className="flex items-center gap-1 w-48 justify-end flex-shrink-0">
              <button className={`btn btn-ghost btn-circle btn-sm ${isInFavorites ? 'text-pink-500' : 'text-gray-600 dark:text-gray-300'} hover:bg-pink-50 dark:hover:bg-pink-500/10`} onClick={handleAddToFavorites} title="添加到喜欢">
                <Heart size={18} fill={isInFavorites ? "currentColor" : "none"} />
              </button>
              {isOnlineMusic && (
                <button 
                  className={clsx(
                    "btn btn-ghost btn-circle btn-sm",
                    currentSong?.isDownloaded 
                      ? "text-green-500 cursor-not-allowed" 
                      : "text-gray-600 dark:text-gray-300 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10"
                  )} 
                  onClick={handleDownload} 
                  disabled={isDownloading || currentSong?.isDownloaded} 
                  title={currentSong?.isDownloaded ? "已下载" : "下载"}
                >
                  {isDownloading ? <span className="loading loading-spinner loading-xs" /> : <Download size={18} />}
                </button>
              )}
              <button className="btn btn-ghost btn-circle btn-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10" onClick={() => setShowPlaylistModal(true)} title="添加到歌单">
                <Plus size={18} />
              </button>
              <button className="btn btn-ghost btn-circle btn-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10" onClick={() => setShowPlayQueue(true)} title="播放列表">
                <List size={18} />
              </button>
              <div className="flex items-center gap-1.5 ml-2 px-2 py-1 rounded-full bg-gray-200/50 dark:bg-white/5">
                <Volume2 size={14} className="text-gray-500 dark:text-gray-400" />
                <input type="range" min="0" max="100" value={volume} onChange={(e) => setAudioVolumn(Number(e.target.value))} className="w-16 h-1 bg-gray-300/50 dark:bg-gray-700/50 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gray-600 dark:[&::-webkit-slider-thumb]:bg-gray-300" style={{ background: `linear-gradient(to right, rgb(107,114,128) ${volume}%, rgb(209,213,219) ${volume}%)` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 添加到歌单弹窗 - 使用Portal渲染到body下 */}
      {showPlaylistModal && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9998]" onClick={() => setShowPlaylistModal(false)}>
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl p-5 rounded-3xl w-72 shadow-2xl border border-white/20" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4 dark:text-white">添加到歌单</h3>
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
              {userPlaylists.length === 0 ? <p className="text-sm text-gray-500 py-2">暂无可添加的歌单</p> : userPlaylists.map((playlist) => (
                <button key={playlist.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-left" onClick={() => handleAddToPlaylist(playlist.id)}>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center shadow-lg"><ListMusic className="w-5 h-5 text-white" /></div>
                  <span className="font-medium dark:text-white truncate">{playlist.name}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-4"><button className="btn btn-ghost btn-sm rounded-full" onClick={() => setShowPlaylistModal(false)}>取消</button></div>
          </div>
        </div>,
        document.body
      )}

      {/* 播放列表抽屉 - 使用Portal渲染到body下 */}
      {showPlayQueue && createPortal(
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => setShowPlayQueue(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl shadow-2xl z-[9999] flex flex-col border-l border-white/20">
            <div className="flex items-center justify-between p-5 border-b border-gray-200/20 dark:border-white/10">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg dark:text-white">播放列表</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">共 {playQueue.length} 首</span>
              </div>
              <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setShowPlayQueue(false)}><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {playQueue.length === 0 ? <p className="text-sm text-gray-500 py-4 text-center">播放列表为空</p> : playQueue.map((song: import("../stores/usePlayerStore").Song, index: number) => (
                <div key={`${song.path}-${index}`} className={`group flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${currentSong?.path === song.path ? "bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-600 dark:text-pink-400" : "hover:bg-gray-100 dark:hover:bg-white/5"}`} onClick={() => playSong(song)}>
                  <div className="w-6 h-6 rounded flex items-center justify-center text-xs">
                    {currentSong?.path === song.path && isPlaying ? <span className="animate-pulse text-pink-500">▶</span> : <span className="text-gray-400">{index + 1}</span>}
                  </div>
                  <span className="truncate flex-1 text-sm font-medium dark:text-white">{song.name}</span>
                  <span className={clsx(
                    "text-xs px-2 py-0.5 rounded-full shrink-0",
                    currentSong?.path === song.path
                      ? (song.isOnline 
                          ? "bg-white/40 text-white font-bold" 
                          : "bg-white/40 text-green-200 font-bold")
                      : (song.isOnline 
                          ? "bg-primary/20 text-primary" 
                          : "bg-green-500/20 text-green-600 dark:text-green-400")
                  )}>
                    {song.isOnline ? "在线" : "本地"}
                  </span>
                  <button 
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-500/20 rounded transition-all"
                    onClick={(e) => { e.stopPropagation(); removeFromPlayQueue(song.path); }}
                  >
                    <X size={14} className="text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Toast 通知 - 使用 Portal 渲染到 body */}
      {toast && createPortal(
        <div className="fixed top-4 right-4 z-[10000]">
          <div className={`alert alert-${toast.type} shadow-lg`}>
            <span>{toast.message}</span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}