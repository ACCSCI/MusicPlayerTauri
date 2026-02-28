import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface Song {
  path: string;
  name: string;
  isOnline?: boolean;
  bvId?: string;
  page?: number;
  isDownloaded?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  songs: Song[];
  isSystem?: boolean;
}

export interface AppSettings {
  downloadFolder: string | null;
}

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

export const LOCAL_PLAYLIST_ID = "local";
export const FAVORITES_PLAYLIST_ID = "favorites";

interface PlayerState {
  isPlaying: boolean;
  volume: number;
  playQueue: Song[];
  localLibrary: Song[];
  currentSong: Song | null;
  playlists: Playlist[];
  settings: AppSettings;
  toast: Toast | null;

  togglePlay: () => void;
  setVolume: (val: number) => void;
  playSong: (song: Song) => void;
  addMusic: (songs: Song[]) => void;
  addToNext: (song: Song) => void;
  removeFromPlayQueue: (songPath: string) => void;
  setIsPlaying: (state: boolean) => void;
  playPrev: () => void;
  playNext: () => void;
  setLocalLibrary: (songs: Song[]) => void;
  setPlayQueue: (songs: Song[]) => void;
  resetPlayQueue: () => void;

  createPlaylist: (name: string, isSystem?: boolean) => void;
  deletePlaylist: (id: string) => void;
  addSongToPlaylist: (playlistId: string, song: Song) => void;
  removeSongFromPlaylist: (playlistId: string, songPath: string) => void;
  updatePlaylistSongs: (playlistId: string, songs: Song[]) => void;
  loadPlaylists: () => Promise<void>;

  scanMusic: (path: string) => Promise<void>;
  initPlaylist: () => Promise<void>;
  loadSettings: () => Promise<void>;
  setDownloadFolder: (folder: string | null) => Promise<void>;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  convertOnlineToLocal: (oldPath: string, newPath: string, songName: string) => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  const initPlaylist = async () => {
    try {
      const savedQueue = await invoke<Song[]>("load_play_queue");
      set({ playQueue: savedQueue });
      const savedLibrary = await invoke<Song[]>("load_library");
      if (savedLibrary) {
        set({ localLibrary: savedLibrary });
      } else {
        set({ localLibrary: savedQueue });
      }

      await get().loadPlaylists();

      const state = get();
      const hasLocalPlaylist = state.playlists.some(p => p.id === LOCAL_PLAYLIST_ID);
      if (!hasLocalPlaylist) {
        get().createPlaylist("本地音乐", true);
      }

      console.log(
        `初始化完成: 播放队列${savedQueue.length}首, 本地曲库${savedLibrary.length}首`
      );
    } catch (e) {
      console.error("加载数据失败:", e);
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await invoke<{ download_folder: string | null }>("load_settings");
      set({ settings: { downloadFolder: settings.download_folder } });
    } catch (e) {
      console.error("加载设置失败:", e);
      set({ settings: { downloadFolder: null } });
    }
  };

  const setDownloadFolder = async (folder: string | null) => {
    const newSettings = { download_folder: folder };
    set({ settings: { downloadFolder: folder } });
    try {
      await invoke("save_settings", { settings: newSettings });
    } catch (e) {
      console.error("保存设置失败:", e);
    }
  };

  initPlaylist();
  loadSettings();

  return {
    isPlaying: false,
    volume: 100,
    playQueue: [],
    localLibrary: [],
    currentSong: null,
    playlists: [],
    settings: { downloadFolder: null },
    toast: null,
    initPlaylist,
    loadSettings,
    setDownloadFolder,
    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
    setLocalLibrary: (songs) => set({ localLibrary: songs }),
    setPlayQueue: (songs) => set({ playQueue: songs }),
    resetPlayQueue: () => {
      const allSongs = get().localLibrary;
      set({ playQueue: allSongs });
      invoke("save_play_queue", { songs: allSongs });
    },
    setVolume: (val) => set({ volume: val }),
    playSong: (song) => {
      const { playQueue, currentSong } = get();
      const exists = playQueue.some(s => s.path === song.path);
      let newQueue: Song[];
      
      if (exists) {
        newQueue = playQueue;
      } else if (currentSong) {
        const currentIndex = playQueue.findIndex(s => s.path === currentSong.path);
        const insertIndex = currentIndex !== -1 ? currentIndex + 1 : playQueue.length;
        newQueue = [...playQueue];
        newQueue.splice(insertIndex, 0, song);
      } else {
        newQueue = [...playQueue, song];
      }
      
      set({ playQueue: newQueue, currentSong: song, isPlaying: true });
      invoke("save_play_queue", { songs: newQueue });
    },
    setIsPlaying: (state) => set({ isPlaying: state }),
    playPrev: () => {
      const state = get();
      const { playQueue, currentSong } = state;
      if (playQueue.length === 0 || !currentSong) return;

      const currentIndex = playQueue.findIndex(
        (song) => song.path === currentSong.path
      );
      const prevIndex = (currentIndex - 1 + playQueue.length) % playQueue.length;
      const prevSong = playQueue[prevIndex];
      set({ currentSong: prevSong, isPlaying: true });
    },
    playNext: () => {
      const state = get();
      const { playQueue, currentSong } = state;
      if (playQueue.length === 0 || !currentSong) return;

      const currentIndex = playQueue.findIndex(
        (song) => song.path === currentSong.path
      );
      const nextIndex = (currentIndex + 1) % playQueue.length;
      const nextSong = playQueue[nextIndex];
      set({ currentSong: nextSong, isPlaying: true });
    },

    createPlaylist: (name: string, isSystem: boolean = false) => {
      const id = isSystem 
        ? (name === "本地音乐" ? LOCAL_PLAYLIST_ID : FAVORITES_PLAYLIST_ID)
        : Date.now().toString();
      const newPlaylist: Playlist = {
        id,
        name,
        songs: [],
        isSystem,
      };
      const newPlaylists = [...get().playlists, newPlaylist];
      set({ playlists: newPlaylists });
      invoke("save_playlists", { playlists: newPlaylists });
    },

    deletePlaylist: (id: string) => {
      const newPlaylists = get().playlists.filter((p) => p.id !== id);
      set({ playlists: newPlaylists });
      invoke("save_playlists", { playlists: newPlaylists });
    },

    addSongToPlaylist: (playlistId: string, song: Song) => {
      const newPlaylists = get().playlists.map((p) => {
        if (p.id === playlistId) {
          const exists = p.songs.some((s) => s.path === song.path);
          if (!exists) {
            return { ...p, songs: [...p.songs, song] };
          }
        }
        return p;
      });
      set({ playlists: newPlaylists });
      invoke("save_playlists", { playlists: newPlaylists });
    },

    removeSongFromPlaylist: (playlistId: string, songPath: string) => {
      const newPlaylists = get().playlists.map((p) => {
        if (p.id === playlistId) {
          return { ...p, songs: p.songs.filter((s) => s.path !== songPath) };
        }
        return p;
      });
      set({ playlists: newPlaylists });
      invoke("save_playlists", { playlists: newPlaylists });
    },

    updatePlaylistSongs: (playlistId: string, songs: Song[]) => {
      const newPlaylists = get().playlists.map((p) => {
        if (p.id === playlistId) {
          return { ...p, songs };
        }
        return p;
      });
      set({ playlists: newPlaylists });
      invoke("save_playlists", { playlists: newPlaylists });
    },

    convertOnlineToLocal: async (oldPath: string, newPath: string, songName: string) => {
      const newSong = { path: newPath, name: songName, isOnline: true, isDownloaded: true };
      
      await get().loadPlaylists();
      
      let currentPlaylists = get().playlists;
      
      let hasLocalPlaylist = currentPlaylists.some(p => p.id === LOCAL_PLAYLIST_ID);
      if (!hasLocalPlaylist) {
        get().createPlaylist("本地音乐", true);
        currentPlaylists = get().playlists;
      }
      
      const newPlaylists = currentPlaylists.map((p) => {
        if (p.id === LOCAL_PLAYLIST_ID) {
          const exists = p.songs.some((s) => s.path === newPath);
          if (!exists) {
            return { ...p, songs: [...p.songs, newSong] };
          }
          return p;
        }
        const newSongs = p.songs.map((s) => {
          if (s.path === oldPath) {
            return { ...s, path: newPath, isOnline: true, isDownloaded: true };
          }
          return s;
        });
        return { ...p, songs: newSongs };
      });
      set({ playlists: newPlaylists });
      invoke("save_playlists", { playlists: newPlaylists });

      const updatedPlayQueue = get().playQueue.map((s) => {
        if (s.path === oldPath) {
          return { ...s, path: newPath, isOnline: true, isDownloaded: true };
        }
        return s;
      });

      const songExists = updatedPlayQueue.some(s => s.path === newPath);
      const finalPlayQueue = songExists 
        ? updatedPlayQueue 
        : [...updatedPlayQueue, newSong];

      set({ playQueue: finalPlayQueue });
      invoke("save_play_queue", { songs: finalPlayQueue });
    },

    loadPlaylists: async () => {
      try {
        const savedPlaylists = await invoke<Playlist[]>("load_playlists");
        if (savedPlaylists) {
          set({ playlists: savedPlaylists });
        }
      } catch (e) {
        console.error("加载歌单失败:", e);
      }
    },

    scanMusic: async (path) => {
      try {
        const songs: Song[] = await invoke("scan_music", { targetDir: path });
        const newLibrary = mergeUnique(get().localLibrary, songs);
        set({ localLibrary: newLibrary });
        invoke("save_to_library", { songs: newLibrary });
      } catch (e) {
        console.error("Rust扫描翻车了:", e);
      }
    },
    addMusic: (songs) => {
      const newQueue = mergeUnique(get().playQueue, songs);
      set({ playQueue: newQueue });
    },
    addToNext: (song: Song) => {
      const { playQueue, currentSong } = get();
      const exists = playQueue.some(s => s.path === song.path);
      if (exists) return;
      
      let insertIndex = playQueue.length;
      if (currentSong) {
        const currentIndex = playQueue.findIndex(s => s.path === currentSong.path);
        if (currentIndex !== -1) {
          insertIndex = currentIndex + 1;
        }
      }
      
      const newQueue = [...playQueue];
      newQueue.splice(insertIndex, 0, song);
      set({ playQueue: newQueue });
      invoke("save_play_queue", { songs: newQueue });
    },
    removeFromPlayQueue: (songPath: string) => {
      const newQueue = get().playQueue.filter(s => s.path !== songPath);
      set({ playQueue: newQueue });
      invoke("save_play_queue", { songs: newQueue });
      
      if (get().currentSong?.path === songPath) {
        set({ currentSong: newQueue.length > 0 ? newQueue[0] : null });
      }
    },
    showToast: (message: string, type: 'success' | 'error' | 'info') => {
      set({ toast: { message, type } });
      setTimeout(() => {
        set({ toast: null });
      }, 3000);
    },
    hideToast: () => {
      set({ toast: null });
    },
  };
});

function mergeUnique(origin: Song[], addition: Song[]): Song[] {
  const uniqueMap = new Map<string, Song>();
  origin.forEach((song) => uniqueMap.set(song.path, song));
  addition.forEach((song) => uniqueMap.set(song.path, song));
  return Array.from(uniqueMap.values());
}