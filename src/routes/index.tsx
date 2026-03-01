import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="flex flex-col justify-center items-center h-full gap-4 p-8">
      <h1 className="text-2xl font-bold text-center">欢迎使用 Sonic</h1>
      <p className="text-base-content/60 text-center">
        在底部导航选择功能：<br/>
        收藏 - 管理你的歌单<br/>
        本地音乐 - 扫描本地音频文件<br/>
        设置 - 配置下载目录
      </p>
    </div>
  );
}