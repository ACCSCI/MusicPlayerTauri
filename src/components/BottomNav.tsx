import { useNavigate, useLocation } from "@tanstack/react-router";
import { Home, Library, Settings, Music } from "lucide-react";
import clsx from "clsx";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/" || location.pathname === "/collections";
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: "/", icon: Home, label: "首页" },
    { path: "/collections?playlistId=local", icon: Music, label: "本地" },
    { path: "/collections", icon: Library, label: "收藏" },
    { path: "/settings", icon: Settings, label: "设置" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-base-200 border-t border-base-300 flex items-center justify-around px-2 safe-area-bottom z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        return (
          <button
            key={item.path}
            onClick={() => navigate({ to: item.path })}
            className={clsx(
              "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-[60px]",
              active
                ? "text-primary"
                : "text-base-content/60 hover:text-base-content"
            )}
          >
            <Icon className={clsx("w-6 h-6", active && "fill-primary/20")} />
            <span className="text-xs">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}