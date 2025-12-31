import { Link, useNavigate } from "@tanstack/react-router";
import { ClipboardPaste } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { usePlayerStore } from "../stores/usePlayerStore";
import { invoke } from "@tauri-apps/api/core";

export default function SideBar() {
  const { addMusic, scanMusic, playList } = usePlayerStore();
  const navigate = useNavigate();

  // const handleAdd=async()=>{
  //   const files = await open({
  //   multiple: true,
  //   directory: false,
  //   });

  // };
  const handleScan = async () => {
    const dir = await open({
      multiple: false,
      directory: true,
    });
    if (dir) {
      scanMusic(dir);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* 导航 */}
      <ul className="flex justify-evenly w-full my-2">
        <li>
          <Link to="/">探索</Link>
        </li>
        <li>
          <Link to="/library">库</Link>
        </li>
        <li>
          <Link to="/settings">设置</Link>
        </li>
      </ul>
      {/* 导航 */}

      {/* 在线音乐 */}
      <div className="divider">在线音乐</div>
      <div className="flex">
        <input
          type="text"
          placeholder="Paste here"
          className="input-lg bg-white rounded-3xl"
        />
        <button className="btn btn-circle">
          <ClipboardPaste />
        </button>
      </div>
      {/* 在线音乐 */}

      {/* 本地音乐 */}
      <div className="divider">本地音乐</div>
      <div className="flex gap-4">
        <button
          className="btn rounded-full px-6 py-1"
          onClick={() => {
            handleScan();
          }}
        >
          扫描
        </button>
      </div>
      {/* 本地音乐 */}

      {/* 歌单 */}
      <div className="divider">收藏</div>
      <div className="flex flex-col">
        <button
          className="btn rounded-full"
          onClick={() => navigate({ to: "/collections" })}
        >
          ❤我喜欢
        </button>
      </div>
      {/* 歌单 */}
    </div>
  );
}
