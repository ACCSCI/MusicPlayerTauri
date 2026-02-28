import { createRootRoute, Outlet } from "@tanstack/react-router";
import SideBar from "../components/SideBar";
import PlayerBar from "../components/PlayerBar";
import TitleBar from "../components/TitleBar";

const RootLayout = () => (
  <div className="w-full h-full grid grid-cols-6 grid-rows-17 gap-2 rounded-2xl overflow-hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-2xl">
    <div className="col-start-1 col-end-7 row-start-1 row-end-2">
      <TitleBar />
    </div>
    <div className="sidebar col-start-1 col-end-3 row-start-2 row-end-15">
      <SideBar />
    </div>
    <div className="content col-start-3 col-end-7 row-start-2 row-end-15">
      <Outlet />
    </div>

    <div className="player col-start-1 col-end-7 row-start-15 row-end-18 flex">
      <PlayerBar />
    </div>
  </div>
);

export const Route = createRootRoute({ component: RootLayout });