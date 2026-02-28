import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X, Music } from "lucide-react";

export default function TitleBar() {
  const appWindow = getCurrentWindow();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    appWindow.isMaximized().then(setIsMaximized);
    
    const unlisten = appWindow.onResized(async () => {
      const maximized = await appWindow.isMaximized();
      setIsMaximized(maximized);
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  return (
    <div 
      className="h-10 flex items-center justify-between px-4 bg-white/60 dark:bg-black/60 backdrop-blur-xl border-b border-white/20 dark:border-white/10 select-none"
      data-tauri-drag-region
    >
      <div className="flex items-center gap-2" data-tauri-drag-region>
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
          <Music className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-sm dark:text-white">Sonic</span>
      </div>

      <div className="flex items-center gap-1">
        <button 
          onClick={() => appWindow.minimize()}
          className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-200/60 dark:hover:bg-white/10 transition-colors"
        >
          <Minus size={14} className="dark:text-white" />
        </button>
        <button 
          onClick={() => appWindow.toggleMaximize()}
          className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-200/60 dark:hover:bg-white/10 transition-colors"
        >
          {isMaximized ? (
            <Square size={11} className="dark:text-white" />
          ) : (
            <Square size={10} className="dark:text-white" />
          )}
        </button>
        <button 
          onClick={() => appWindow.close()}
          className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors group"
        >
          <X size={14} className="group-hover:text-white dark:text-white" />
        </button>
      </div>
    </div>
  );
}