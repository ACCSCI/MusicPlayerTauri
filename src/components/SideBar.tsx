import { Link, useNavigate } from "@tanstack/react-router";
import { Compass, Library, Settings, Plus, FolderOpen, Music, ListMusic, Trash2, HardDrive, Loader2 } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { usePlayerStore, LOCAL_PLAYLIST_ID, FAVORITES_PLAYLIST_ID, Song } from "../stores/usePlayerStore";
import { useState } from "react";

export default function SideBar() {
  const { scanMusic, playlists, createPlaylist, deletePlaylist, playSong, localLibrary } = usePlayerStore();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [onlineUrl, setOnlineUrl] = useState("");
const [isParsing, setIsParsing] = useState(false);

  const handleScan = async () => {
    const dir = await open({
      multiple: false,
      directory: true,
    });
    if (dir) {
      scanMusic(dir);
    }
  };

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim());
      setNewPlaylistName("");
      setShowCreateModal(false);
    }
  };

  const handleParseOnlineMusic = async () => {
    if (!onlineUrl.trim() || isParsing) return;

    setIsParsing(true);
    try {
      const song: Song = await invoke("parse_bilibili_url", { url: onlineUrl.trim() });
      song.isOnline = true;
      playSong(song);
      setOnlineUrl("");
    } catch (e) {
      console.error("解析失败:", e);
      alert("解析失败: " + e);
    } finally {
      setIsParsing(false);
    }
  };

  const navItems = [
    { to: "/", icon: Compass, label: "探索" },
    { to: "/library", icon: Library, label: "音乐库" },
    { to: "/settings", icon: Settings, label: "设置" },
  ];

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-base-200 via-base-100 to-base-200 p-4 overflow-y-auto scrollbar-thin">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <Music className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          MusicBox
        </span>
      </div>

      {/* 导航 */}
      <nav className="flex flex-col gap-2 px-2">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-base-300/50 hover:scale-[1.02]"
          >
            <item.icon className="w-5 h-5 text-base-content/70" />
            <span className="font-medium text-base-content/80">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="divider mx-4 my-4" />

      {/* 在线音乐 */}
      <div className="px-4">
        <h3 className="text-sm font-semibold text-base-content/50 uppercase tracking-wider mb-3">
          在线音乐
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="粘贴B站视频链接"
            className="input input-sm input-bordered flex-1 bg-base-100/50 focus:bg-base-100 transition-colors"
            value={onlineUrl}
            onChange={(e) => setOnlineUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleParseOnlineMusic()}
          />
          <button 
            className="btn btn-sm btn-circle btn-primary"
            onClick={handleParseOnlineMusic}
            disabled={isParsing}
          >
            {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 本地音乐 */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-semibold text-base-content/50 uppercase tracking-wider mb-3">
          本地音乐
        </h3>
        <div className="flex flex-col gap-2">
          <button
            className="flex items-center gap-3 p-3 rounded-xl bg-base-200 hover:bg-base-300 transition-colors group"
            onClick={() => navigate({ to: "/collections", search: { playlistId: LOCAL_PLAYLIST_ID } })}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium">本地音乐</div>
<div className="text-xs text-base-content/50">
                {localLibrary.length} 首
              </div>
            </div>
          </button>
          <button
            className="w-full flex items-center justify-center gap-2 btn btn-outline btn-sm rounded-xl hover:btn-primary transition-all duration-200"
            onClick={handleScan}
          >
            <FolderOpen className="w-4 h-4" />
            扫描文件夹
          </button>
        </div>
      </div>

      {/* 我的收藏 */}
      <div className="px-4 mt-6 flex-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-base-content/50 uppercase tracking-wider">
            我的收藏
          </h3>
          <button
            className="btn btn-ghost btn-xs btn-circle"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex flex-col gap-2 overflow-y-auto">
          {playlists.filter(p => p.id === FAVORITES_PLAYLIST_ID).map((playlist) => (
            <div
              key={playlist.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-base-300/50 transition-colors cursor-pointer"
              onClick={() => navigate({ to: "/collections", search: { playlistId: playlist.id } })}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center">
                <ListMusic className="w-4 h-4 text-white" />
              </div>
              <span className="truncate flex-1">{playlist.name}</span>
              <span className="text-xs text-base-content/40">
                {playlist.songs.length}
              </span>
            </div>
          ))}
          
          {playlists.filter(p => p.id !== LOCAL_PLAYLIST_ID && p.id !== FAVORITES_PLAYLIST_ID).map((playlist) => (
            <div
              key={playlist.id}
              className="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-base-300/50 transition-colors cursor-pointer"
              onClick={() => navigate({ to: "/collections", search: { playlistId: playlist.id } })}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center">
                <ListMusic className="w-4 h-4 text-white" />
              </div>
              <span className="truncate flex-1">{playlist.name}</span>
              <span className="text-xs text-base-content/40">
                {playlist.songs.length}
              </span>
              <button
                className="opacity-0 group-hover:opacity-100 btn btn-ghost btn-xs btn-circle"
                onClick={(e) => {
                  e.stopPropagation();
                  deletePlaylist(playlist.id);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 创建歌单弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowCreateModal(false); setNewPlaylistName(""); }}>
          <div className="bg-base-100 p-6 rounded-2xl w-72 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">创建歌单</h3>
            <input
              type="text"
              placeholder="歌单名称"
              className="input input-bordered w-full mb-4"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreatePlaylist()}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewPlaylistName("");
                }}
              >
                取消
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleCreatePlaylist}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}