import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import SideBar from "../components/SideBar";
import PlayerBar from "../components/PlayerBar";

const RootLayout = () => (
  <div className="w-full h-full grid grid-cols-6 grid-rows-7 gap-4 ">
    <div className="sidebar col-start-1 col-end-3 row-start-1 row-end-6">
      <SideBar />
    </div>
    <div className="content col-start-3 col-end-7 row-start-1 row-end-6">
      <Outlet />
    </div>

    <div className="player col-start-1 col-end-7 row-start-6 row-end-8 flex">
      <PlayerBar />
    </div>
    {/* <TanStackRouterDevtools /> */}
  </div>
);

export const Route = createRootRoute({ component: RootLayout });
