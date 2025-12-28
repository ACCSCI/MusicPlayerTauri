import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

interface Song {
  path: string;
  name: string;
}

interface PlayerState {
  // Data
  isPlaying: boolean;
  volume: number;
  playList: Array<Song>;
  fullLibrary: Song[];
  currentSong: Song | null;

  // Action
  togglePlay: () => void;
  setVolume: (val: number) => void;
  playSong: (song: Song) => void;
  addMusic: (songs: Song[]) => void;
  setIsPlaying: (state: boolean) => void;
  playPrev: () => void;
  playNext: () => void;
  setFullLibrary: (songs: Song[]) => void;
  setPlayList: (songs: Song[]) => void;

  resetPlaylist: () => void;

  // Async Action
  scanMusic: (path: string) => Promise<void>;
  initPlaylist: () => Promise<void>; // 初始化/刷新歌单的核心方法
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  // 🔥 核心：异步初始化逻辑（抽成独立方法，方便复用）
  const initPlaylist = async () => {
    try {
      // 1. 加载【播放列表】(用于显示和播放)
      const savedPlaylist = await invoke<Song[]>("load_playlist");
      set({ playList: savedPlaylist });
      // 2. 加载【全量曲库】(用于 AI 检索)
      // 如果第一次运行没有库，就用播放列表充当库，或者为空
      const savedLibrary = await invoke<Song[]>("load_library");
      set({ fullLibrary: savedPlaylist });

      console.log(
        `初始化完成: 列表${savedPlaylist.length}首, 曲库${savedLibrary.length}首`
      );
    } catch (e) {
      console.error("加载数据失败:", e);
    }
  };

  // Store 初始化时立即执行异步逻辑
  initPlaylist();
  return {
    isPlaying: false,
    volume: 100,
    playList: [],
    fullLibrary: [],
    currentSong: null,
    initPlaylist,
    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
    setFullLibrary: (songs) => set({ fullLibrary: songs }),
    setPlayList: (songs) => set({ playList: songs }),
    // 还原功能：把播放列表重置为全量库
    resetPlaylist: () => {
      const allSongs = get().fullLibrary;
      set({ playList: allSongs });
    },
    setVolume: (val) => set({ volume: val }),
    playSong: (song) => set({ currentSong: song, isPlaying: true }),
    setIsPlaying: (state) => set({ isPlaying: state }),
    playPrev: () => {
      const state = get(); // 获取当前store状态
      const { playList, currentSong } = state;

      // 边界处理：列表为空/无当前歌曲时不操作
      if (playList.length === 0 || !currentSong) return;

      // 找到当前歌曲在列表中的索引
      const currentIndex = playList.findIndex(
        (song) => song.path === currentSong.path
      );

      // 计算下一首索引：第一首一首则切回最后一首（循环播放）
      const prevIndex = (currentIndex - 1 + playList.length) % playList.length;

      // 获取下一首歌曲并播放
      const prevSong = playList[prevIndex];
      set({ currentSong: prevSong, isPlaying: true });
    },
    playNext: () => {
      const state = get(); // 获取当前store状态
      const { playList, currentSong } = state;

      // 边界处理：列表为空/无当前歌曲时不操作
      if (playList.length === 0 || !currentSong) return;

      // 找到当前歌曲在列表中的索引
      const currentIndex = playList.findIndex(
        (song) => song.path === currentSong.path
      );

      // 计算下一首索引：最后一首则切回第一首（循环播放）
      const nextIndex = (currentIndex + 1) % playList.length;

      // 获取下一首歌曲并播放
      const nextSong = playList[nextIndex];
      set({ currentSong: nextSong, isPlaying: true });
    },

    scanMusic: async (path) => {
      try {
        const songs: Song[] = await invoke("scan_music", { targetDir: path });
        const newList = mergeUnique(get().playList, songs);
        set({ playList: newList });
        set({ fullLibrary: newList });
        // 2. 保存到后端【曲库】
        await invoke("save_to_library", { songs: songs });

        // 3. 保存到后端【播放列表】
        await invoke("save_playlist", { songs: songs });
      } catch (e) {
        console.error("Rust扫描翻车了:", e);
      }
    },
    addMusic: (songs) => {
      const newList = mergeUnique(get().playList, songs);
      set({ playList: newList });
    },
  };
});

//Helper Function
function mergeUnique(origin: Song[], addition: Song[]): Song[] {
  const uniqueMap = new Map<string, Song>();
  origin.forEach((song) => uniqueMap.set(song.path, song));
  addition.forEach((song) => uniqueMap.set(song.path, song));
  const newList = [];
  for (let pair of uniqueMap.entries()) {
    newList.push({ path: pair[0], name: pair[1] });
  }
  return Array.from(uniqueMap.values());
}
