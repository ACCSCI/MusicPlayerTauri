import { useState, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import clsx from "clsx";
import { invoke } from "@tauri-apps/api/core";
import { usePlayerStore } from "../stores/usePlayerStore";
import { useNavigate } from "@tanstack/react-router";
import { Song } from "../stores/usePlayerStore";

export function AIChatInput() {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 1. 获取 Store 里的全量库和设置列表的方法
  const { localLibrary, setPlayQueue } = usePlayerStore();

  const navigate = useNavigate(); // 用于跳转

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    try {
      console.log("正在请求 AI...");

      // 2. 核心调用：把心情 + 本地所有歌 传给 Rust
      const result = await invoke("ai_recommend_playlist", {
        userInput: input,
        allSongs: localLibrary, // 关键：把仓库里的歌传过去
      });

      const recommendedSongs: Song[] = result as Song[];

      if (recommendedSongs.length > 0) {
        console.log("AI 推荐成功:", recommendedSongs.length);

        // 3. 直接把播放列表替换为 AI 推荐的歌
        setPlayQueue(recommendedSongs);

        // 4. (可选) 顺便保存这个临时歌单到 backend，这样重启后还在
        invoke("save_playlist", { songs: recommendedSongs });
        setInput(""); // 清空
        // 发送后高度重置
        if (textareaRef.current) textareaRef.current.style.height = "auto";
        // 5. 跳转回播放器页面 (歌单页)
        navigate({ to: "/collections", search: { playlistId: undefined } });
      } else {
        alert("AI 似乎没找到匹配的歌，换个说法试试？");
      }
    } catch (e) {
      console.error("AI 失败:", e);
      alert("AI 出错了，请检查网络或 Key");
    } finally {
      setIsLoading(false);
      setInput("");
    }
  };

  // 核心功能：自动调整高度 (Auto-resize)
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto"; // 先重置高度，防止只增不减
      // 设置新高度，最大不超过 200px (max-h-52)
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 监听回车：如果是 Enter 且没有按 Shift，则发送
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // 阻止默认换行
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      {/* 1. 外层容器：
            - rounded-3xl: 大圆角，还原图片风格
            - shadow-sm: 微微的阴影增加层次感
            - border: 边框
            - focus-within: 当输入框聚焦时，整个容器边框变色
      */}
      <div className="relative flex items-end gap-2 bg-base-100 border border-base-300 rounded-3xl shadow-sm p-2 transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
        {/* 2. 文本域 */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="今天，你又在想什么呢..."
          className={clsx(
            "w-full bg-transparent border-0 focus:ring-0 resize-none py-3 pl-4 pr-12 max-h-52 overflow-y-auto",
            "text-base-content placeholder:text-base-content/40 outline-none",
            // 隐藏滚动条样式 (可选)
            "scrollbar-none"
          )}
          // 初始高度，例如 56px
          style={{ height: "56px", minHeight: "56px" }}
          rows={1}
        />

        {/* 3. 发送按钮 (绝对定位在右下角) */}
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className={clsx(
            "absolute bottom-2 right-2 btn btn-circle btn-sm transition-all duration-200",
            // 有内容时：显示主色；无内容时：显示灰色不可点
            input.trim()
              ? "btn-primary text-primary-content shadow-md"
              : "bg-base-200 text-base-content/20 hover:bg-base-200 cursor-not-allowed border-transparent"
          )}
        >
          {isLoading ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <ArrowUp size={18} strokeWidth={2.5} />
          )}
        </button>
      </div>

      {/* 底部提示文字 (可选，像 ChatGPT 那样的 disclaimer) */}
      <div className="text-center mt-2 text-xs text-base-content/40">
        基于情绪的AI生成歌单
      </div>
    </div>
  );
}
