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
