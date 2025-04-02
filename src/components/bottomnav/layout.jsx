import { Outlet } from "react-router-dom"
import BottomNav from "./bottomnav"

const Layout = () => {
  return (
    <div>
      <Outlet /> {/* This renders the current page */}
      <BottomNav /> {/* Bottom navigation stays persistent */}
    </div>
  )
}

export default Layout
