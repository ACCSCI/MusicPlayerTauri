import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface Song {
  path: string;
  name: string;
  isOnline?: boolean;
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

export const LOCAL_PLAYLIST_ID = "local";
export const FAVORITES_PLAYLIST_ID = "favorites";

interface PlayerState {
  isPlaying: boolean;
  volume: number;
  playList: Song[];
  fullLibrary: Song[];
  currentSong: Song | null;
  playlists: Playlist[];
  settings: AppSettings;

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
  convertOnlineToLocal: (oldPath: string, newPath: string) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  const initPlaylist = async () => {
    try {
      const savedPlaylist = await invoke<Song[]>("load_playlist");
      set({ playList: savedPlaylist });
      const savedLibrary = await invoke<Song[]>("load_library");
      if (savedLibrary) {
        set({ fullLibrary: savedLibrary });
      } else {
        set({ fullLibrary: savedPlaylist });
      }

      await get().loadPlaylists();

      // 确保本地音乐歌单存在
      const state = get();
      const hasLocalPlaylist = state.playlists.some(p => p.id === LOCAL_PLAYLIST_ID);
      if (!hasLocalPlaylist) {
        get().createPlaylist("本地音乐", true);
      }

      console.log(
        `初始化完成: 列表${savedPlaylist.length}首, 曲库${savedLibrary.length}首`
      );
    } catch (e) {
      console.error("加载数据失败:", e);
    }
  };

  const loadSettings = async () => {
    try {
      const settings: AppSettings = await invoke("load_settings");
      set({ settings: { downloadFolder: settings.downloadFolder } });
    } catch (e) {
      console.error("加载设置失败:", e);
      set({ settings: { downloadFolder: null } });
    }
  };

  const setDownloadFolder = async (folder: string | null) => {
    const newSettings: AppSettings = { downloadFolder: folder };
    set({ settings: newSettings });
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
    playList: [],
    fullLibrary: [],
    currentSong: null,
    playlists: [],
    settings: { downloadFolder: null },
    initPlaylist,
    loadSettings,
    setDownloadFolder,
    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
    setFullLibrary: (songs) => set({ fullLibrary: songs }),
    setPlayList: (songs) => set({ playList: songs }),
    resetPlaylist: () => {
      const allSongs = get().fullLibrary;
      set({ playList: allSongs });
      invoke("save_playlist", { songs: allSongs });
    },
    setVolume: (val) => set({ volume: val }),
    playSong: (song) => set({ currentSong: song, isPlaying: true }),
    setIsPlaying: (state) => set({ isPlaying: state }),
    playPrev: () => {
      const state = get();
      const { playList, currentSong } = state;
      if (playList.length === 0 || !currentSong) return;

      const currentIndex = playList.findIndex(
        (song) => song.path === currentSong.path
      );
      const prevIndex = (currentIndex - 1 + playList.length) % playList.length;
      const prevSong = playList[prevIndex];
      set({ currentSong: prevSong, isPlaying: true });
    },
    playNext: () => {
      const state = get();
      const { playList, currentSong } = state;
      if (playList.length === 0 || !currentSong) return;

      const currentIndex = playList.findIndex(
        (song) => song.path === currentSong.path
      );
      const nextIndex = (currentIndex + 1) % playList.length;
      const nextSong = playList[nextIndex];
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

    convertOnlineToLocal: (oldPath: string, newPath: string) => {
      const newPlaylists = get().playlists.map((p) => {
        const newSongs = p.songs.map((s) => {
          if (s.path === oldPath) {
            return { ...s, path: newPath, isOnline: false };
          }
          return s;
        });
        return { ...p, songs: newSongs };
      });
      set({ playlists: newPlaylists });
      invoke("save_playlists", { playlists: newPlaylists });

      const newPlayList = get().playList.map((s) => {
        if (s.path === oldPath) {
          return { ...s, path: newPath, isOnline: false };
        }
        return s;
      });
      set({ playList: newPlayList, fullLibrary: newPlayList });
      invoke("save_playlist", { songs: newPlayList });
      invoke("save_to_library", { songs: newPlayList });

      if (get().currentSong?.path === oldPath) {
        set({ currentSong: { ...get().currentSong!, path: newPath, isOnline: false } });
      }
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
        const newList = mergeUnique(get().playList, songs);
        set({ playList: newList });
        set({ fullLibrary: newList });

        // 获取本地音乐歌单并添加歌曲
        const state = get();
        const localPlaylist = state.playlists.find(p => p.id === LOCAL_PLAYLIST_ID);
        if (localPlaylist) {
          const mergedSongs = mergeUnique(localPlaylist.songs, songs);
          get().updatePlaylistSongs(LOCAL_PLAYLIST_ID, mergedSongs);
        }

        await invoke("save_to_library", { songs: newList });
        await invoke("save_playlist", { songs: newList });
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

function mergeUnique(origin: Song[], addition: Song[]): Song[] {
  const uniqueMap = new Map<string, Song>();
  origin.forEach((song) => uniqueMap.set(song.path, song));
  addition.forEach((song) => uniqueMap.set(song.path, song));
  return Array.from(uniqueMap.values());
}