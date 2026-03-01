import { createRootRoute, Outlet } from "@tanstack/react-router";
import BottomNav from "../components/BottomNav";
import PlayerBar from "../components/PlayerBar";

const RootLayout = () => (
  <div className="w-full h-full flex flex-col bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
    <div className="flex-1 overflow-hidden">
      <Outlet />
    </div>
    <PlayerBar />
    <BottomNav />
  </div>
);

export const Route = createRootRoute({ component: RootLayout });