import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

const RootLayout = () => (
  <>
    <ul className="menu menu-vertical lg:menu-horizontal bg-base-200 rounded-box">
      <li>
          <Link to="/" >
            Home
          </Link>
      </li>
      <li>
          <Link to="/about" >
            About
          </Link>
      </li>
      
      <li>
          <Link to="/posts" >
            Posts
          </Link>
      </li>
    </ul>
    <hr />
    <Outlet />
    <TanStackRouterDevtools />
  </>
)

export const Route = createRootRoute({ component: RootLayout })