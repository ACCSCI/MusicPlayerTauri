import { createFileRoute } from "@tanstack/react-router";
import { usePlayerStore } from "../../stores/usePlayerStore";
import { Virtuoso } from "react-virtuoso";
import clsx from "clsx";
export const Route = createFileRoute("/collections/")({
  component: CollectionsComponent,
});

function CollectionsComponent() {
  const { currentSong, playList, playSong } = usePlayerStore();

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <h1 className="text-xl font-bold p-4 shrink-0">Collections</h1>
      <div className="flex-1 min-h-0">
        <Virtuoso
          className="h-full w-full "
          data={playList}
          itemContent={(index, song) => {
            const isActive = currentSong?.path === song.path;
            return (
              // 渲染每一项 (无需 key，Virtuoso 会自动处理)
              <div
                className={clsx(
                  // [基础样式]：所有行都有的样式
                  "p-2 border-b border-gray-700 w-full text-left truncate cursor-pointer transition-colors",

                  // [条件样式]：根据 isActive 的真假决定
                  isActive
                    ? "bg-blue-600 text-white font-bold" // 如果是当前播放：蓝色背景，白字
                    : "hover:bg-gray-300 text-gray-900" // 如果没播放：普通文字，鼠标悬停变灰
                )}
                onClick={() => playSong(song)}
              >
                <span className="text-left w-full truncate ">{song.name}</span>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
