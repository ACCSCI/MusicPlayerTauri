import { convertFileSrc } from "@tauri-apps/api/core";
import { usePlayerStore } from "../stores/usePlayerStore";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";

export default function PlayerBar() {
  const {
    setIsPlaying,
    volume,
    togglePlay,
    setVolume,
    currentSong,
    playNext,
    playPrev,
    isPlaying,
  } = usePlayerStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // 切换audio标签的播放
  const toggleAudioPlay = () => {
    // 安全检查：确保引擎已经加载
    if (!(audioRef.current && currentSong)) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };
  // 设置audio标签的音量
  const setAudioVolumn = (value: number) => {
    setVolume(value);
    // 2. 同步到Audio元素（转换为0~1范围）
    if (audioRef.current) {
      audioRef.current.volume = value / 100;
    }
  };
  // 进度更新
  const handleTimeUpdate = () => {
    if (audioRef.current) setProgress(audioRef.current.currentTime);
  };

  // 加载元数据（获取总时长）
  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  // 拖拽进度条
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = time;
    setProgress(time);
  };

  // 监听歌曲切换
  useEffect(() => {
    if (currentSong && audioRef.current) {
      audioRef.current.play().catch((e) => {
        console.error("音频加载失败", e);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  }, [currentSong]);

  // 格式化时间 00:00
  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? "0" + sec : sec}`;
  };
  return (
    // 外层容器
    <div
      className="h-2/3 w-4/5 my-auto mx-auto py-4 px-4 relative 
bg-gray-100 rounded-full bg-clip-padding backdrop-blur-md bg-opacity-20 
border border-gray-100 shadow-lg ring-1 ring-black/5"
    >
      {/* 隐藏的 Audio 核心 */}
      <audio
        ref={audioRef}
        src={currentSong ? getAssetUrl(currentSong.path) : undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={playNext} // 播放完自动下一首
        onError={(e) => {
          console.error("音频加载失败:", e);
          setIsPlaying(false);
        }}
      />

      <div className="flex flex-col gap-2 max-w-4xl mx-auto">
        {/* 上半部分：控制按钮 & 信息 */}
        <div className="flex items-center justify-between">
          {/* 左侧：歌曲信息 */}
          <div className="flex items-center gap-3 w-1/3 overflow-visable ">
            <div className="avatar placeholder">
              <div className="relative bg-neutral text-neutral-content rounded-full  w-10 top-3.5">
                <span className="text-xs">CD</span>
              </div>
            </div>
            <div className="flex flex-col truncate">
              <span className="font-bold truncate text-sm">
                {currentSong?.name || "No Music"}
              </span>
              <span className="text-xs text-base-content/60">
                Unknown Artist
              </span>
            </div>
          </div>

          {/* 中间：播放控制按钮 (DaisyUI Button Group) */}
          <div className="flex items-center justify-center gap-4">
            {/* 上一首 */}
            <button
              className="btn btn-ghost btn-circle btn-sm"
              onClick={playPrev}
            >
              <SkipBack size={20} />
            </button>

            {/* 播放/暂停：大圆形按钮 */}
            <button
              className="btn btn-primary btn-circle shadow-lg hover:scale-105 transition-transform"
              onClick={toggleAudioPlay}
            >
              {isPlaying ? (
                <Pause fill="currentColor" />
              ) : (
                <Play fill="currentColor" />
              )}
            </button>

            {/* 下一首 */}
            <button
              className="btn btn-ghost btn-circle btn-sm"
              onClick={playNext}
            >
              <SkipForward size={20} />
            </button>
          </div>

          {/* 右侧：音量 */}
          <div className="flex items-center justify-end gap-2 w-1/4 mx-4">
            <Volume2 size={20} className="text-base-content/70" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setAudioVolumn(Number(e.target.value))}
              className="range range-xs"
            />
          </div>
        </div>

        {/* 下半部分：进度条 (DaisyUI Range) */}
        <div className="py-2 flex justify-center items-center gap-3 text-xs font-mono text-base-content/70">
          <span>{formatTime(progress)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={progress}
            onChange={handleSeek}
            className="range range-primary range-xs cursor-pointer"
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}

const getAssetUrl = (path: string) => {
  // 把所有反斜杠 \ 替换为 正斜杠 /
  const normalizePath = path.replace(/\\/g, "/");
  // 再转换
  return convertFileSrc(normalizePath);
};
