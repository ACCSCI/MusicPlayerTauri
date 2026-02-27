import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Download, ChevronRight, Music } from 'lucide-react';
import { open } from "@tauri-apps/plugin-dialog";
import { usePlayerStore } from '../stores/usePlayerStore';
import { useEffect } from 'react';

export const Route = createFileRoute('/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();
  const { settings, setDownloadFolder, loadSettings } = usePlayerStore();

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSelectDownloadFolder = async () => {
    const dir = await open({
      multiple: false,
      directory: true,
    });
    if (dir) {
      setDownloadFolder(dir);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">设置</h1>

      <div className="space-y-4">
        <div className="bg-base-200 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">下载文件夹</h3>
                <p className="text-sm text-base-content/60">
                  {settings.downloadFolder || "未设置"}
                </p>
              </div>
            </div>
            <button
              className="btn btn-primary btn-sm rounded-full"
              onClick={handleSelectDownloadFolder}
            >
              {settings.downloadFolder ? "更改" : "选择"}
            </button>
          </div>
        </div>

        <div className="bg-base-200 rounded-2xl p-4">
          <div 
            className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate({ to: '/library' })}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center">
                <Music className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">音乐库</h3>
                <p className="text-sm text-base-content/60">
                  管理本地音乐
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-base-content/40" />
          </div>
        </div>
      </div>
    </div>
  );
}