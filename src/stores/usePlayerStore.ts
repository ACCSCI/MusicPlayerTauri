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
  currentSong: Song | null;

  // Action
  togglePlay: () => void;
  setVolume: (val: number) => void;
  playSong: (song: Song) => void;
  addMusic: (songs: Song[]) => void;
  setIsPlaying: (state: boolean) => void;
  playPrev: () => void;
  playNext: () => void;

  // Async Action
  scanMusic: (path: string) => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isPlaying: false,
  volume: 100,
  playList: [],
  currentSong: null,

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

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
    } catch (e) {
      console.error("Rust扫描翻车了:", e);
    }
  },
  addMusic: (songs) => {
    const newList = mergeUnique(get().playList, songs);
    set({ playList: newList });
  },
}));

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
