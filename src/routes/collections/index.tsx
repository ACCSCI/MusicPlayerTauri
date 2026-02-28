import { createFileRoute } from "@tanstack/react-router";
import { usePlayerStore } from "../../stores/usePlayerStore";
import { Virtuoso } from "react-virtuoso";
import clsx from "clsx";
import { ListMusic, HardDrive, Trash2, FolderOpen, Plus, X, ListPlus, Play } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/collections/")({
  component: CollectionsComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      playlistId: search.playlistId as string | undefined,
    };
  },
});

function CollectionsComponent() {
  const {
    currentSong,
    playQueue,
    playSong,
    playPlaylist,
    localLibrary,
    resetPlayQueue,
    playlists,
    removeSongFromPlaylist,
    addSongToPlaylist,
    addToNext,
    scanMusic,
    settings,
  } = usePlayerStore();

  const search = Route.useSearch();
  const currentPlaylist = playlists.find((p) => p.id === search.playlistId);
  const isAIMode = localLibrary.length > 0 && playQueue.length !== localLibrary.length;
  const userPlaylists = playlists;

  useEffect(() => {
    if (search.playlistId === 'local' && settings.downloadFolder) {
      scanMusic(settings.downloadFolder);
    }
  }, [search.playlistId, settings.downloadFolder, scanMusic]);

const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    song: { path: string; name: string; isOnline?: boolean; bvId?: string; page?: number };
  } | null>(null);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);

  const handleContextMenu = (e: React.MouseEvent, song: { path: string; name: string; isOnline?: boolean; bvId?: string; page?: number }) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, song });
  };

  const handleAddToNext = () => {
    if (!contextMenu) return;
    addToNext(contextMenu.song);
    setContextMenu(null);
  };

  const handleRemoveFromPlaylist = () => {
    if (!contextMenu || !search.playlistId) return;
    removeSongFromPlaylist(search.playlistId, contextMenu.song.path);
    setContextMenu(null);
  };

  const handleShowInFolder = async () => {
    if (!contextMenu || contextMenu.song.isOnline) return;
    try {
      await invoke("reveal_in_explorer", { path: contextMenu.song.path });
    } catch (e) {
      console.error("打开失败:", e);
    }
    setContextMenu(null);
  };

  const handleAddToPlaylist = (playlistId: string) => {
    if (!contextMenu) return;
    addSongToPlaylist(playlistId, contextMenu.song);
    setShowAddToPlaylist(false);
    setContextMenu(null);
  };

const availablePlaylists = playlists.filter(
    p => p.id !== search.playlistId && !p.songs.some(s => s.path === contextMenu?.song.path)
  );

  if (search.playlistId) {
    const songs = search.playlistId === 'local' ? localLibrary : (currentPlaylist?.songs || []);
    const title = search.playlistId === 'local' ? "本地音乐" : (currentPlaylist?.name || "");

    return (
      <div 
        className="h-full flex flex-col overflow-hidden"
        onClick={() => setContextMenu(null)}
      >
        <div className="flex items-center gap-3 p-4 shrink-0">
          <button
            onClick={() => window.history.back()}
            className="btn btn-ghost btn-sm"
          >
            ← 返回
          </button>
{search.playlistId === 'local' ? (
            <HardDrive className="w-6 h-6 text-blue-500" />
          ) : (
            <ListMusic className="w-6 h-6 text-primary" />
          )}
<h1 className="text-xl font-bold">{title}</h1>
          <button
            onClick={() => playPlaylist(songs)}
            className="btn btn-sm bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:scale-105 transition-transform"
            disabled={songs.length === 0}
          >
            <Play size={14} fill="currentColor" />
            播放全部
          </button>
          <span className="text-sm text-base-content/50">
            {songs.length} 首
          </span>
        </div>
        <div className="flex-1 min-h-0">
          <Virtuoso
            className="h-full w-full"
            data={songs}
            itemContent={(_index, song) => {
              const isActive = currentSong?.path === song.path;
              return (
                <div
                  className={clsx(
                    "p-3 border-b border-base-300 w-full text-left truncate cursor-pointer transition-colors",
                    isActive
                      ? "bg-primary text-primary-content font-bold"
                      : "hover:bg-base-200"
                  )}
                  onClick={() => playSong(song)}
                  onContextMenu={(e) => handleContextMenu(e, song)}
                >
<div className="flex items-center gap-2">
                    <span className="text-left w-full truncate">{song.name}</span>
                    <span className={clsx(
                      "text-xs px-1.5 py-0.5 rounded shrink-0",
                      isActive
                        ? (song.isOnline 
                            ? "bg-white/40 text-white font-bold" 
                            : "bg-white/40 text-green-200 font-bold")
                        : (song.isOnline 
                            ? "bg-primary/20 text-primary" 
                            : "bg-green-500/20 text-green-600 dark:text-green-400")
                    )}>
                      {song.isOnline ? "在线" : "本地"}
                    </span>
                  </div>
                </div>
              );
            }}
          />
        </div>

        {/* 右键菜单 */}
        {contextMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
            <div
              className="fixed bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 py-2 min-w-40 z-50"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onClick={(e) => e.stopPropagation()}
            >
              {!contextMenu.song.isOnline && (
                <button
                  className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  onClick={handleShowInFolder}
                >
                  <FolderOpen size={16} className="text-blue-500" />
                  <span>查看本地文件</span>
                </button>
              )}
<button
                className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                onClick={() => setShowAddToPlaylist(true)}
              >
                <Plus size={16} className="text-green-500" />
                <span>添加到歌单</span>
              </button>
              <button
                className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                onClick={handleAddToNext}
              >
                <ListPlus size={16} className="text-purple-500" />
                <span>添加到下一首</span>
              </button>
              {search.playlistId && search.playlistId !== 'local' && (
                <button
                  className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-red-500"
                  onClick={handleRemoveFromPlaylist}
                >
                  <Trash2 size={16} />
                  <span>从歌单删除</span>
                </button>
              )}
            </div>
          </>
        )}

        {/* 添加到歌单弹窗 */}
        {showAddToPlaylist && contextMenu && (
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowAddToPlaylist(false)}
          >
            <div 
              className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl p-5 rounded-3xl w-72 shadow-2xl border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">添加到歌单</h3>
                <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setShowAddToPlaylist(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                {availablePlaylists.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">暂无可添加的歌单</p>
                ) : (
                  availablePlaylists.map((playlist) => (
                    <button
                      key={playlist.id}
                      className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-left"
                      onClick={() => handleAddToPlaylist(playlist.id)}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center shadow-lg">
                        <ListMusic className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium">{playlist.name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 主页面：歌单列表
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <h1 className="text-xl font-bold p-4 shrink-0">收藏</h1>

      {/* 歌单列表 */}
      {userPlaylists.length > 0 && (
        <div className="px-4 pb-4">
          <h2 className="text-sm font-semibold text-base-content/50 uppercase tracking-wider mb-3">
            我的歌单
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {userPlaylists.map((playlist) => (
              <div
                key={playlist.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-base-200 hover:bg-base-300 transition-colors cursor-pointer"
                onClick={() =>
                  (window.location.search = `?playlistId=${playlist.id}`)
                }
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center">
                  <ListMusic className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{playlist.name}</div>
                  <div className="text-xs text-base-content/50">
                    {playlist.songs.length} 首
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAIMode && (
        <div className="p-2">
          <button
            onClick={() => resetPlayQueue()}
            className="bg-red-500 text-white px-4 py-2 rounded w-full"
          >
            退出 AI 推荐 (显示全部 {localLibrary.length} 首)
          </button>
        </div>
      )}
    </div>
  );
}