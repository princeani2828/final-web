import { useNavigate } from "react-router-dom"
import { Home, History, ShoppingCart, User, Scan } from "lucide-react"
import "../styles.css" // Ensure the correct path to your styles

const BottomNav = () => {
  const navigate = useNavigate()

  return (
    <nav className="bottom-nav">
      <Home className="nav-icon" onClick={() => navigate("/")} />
      <History className="nav-icon" onClick={() => navigate("/notifications")} />
      <div className="scan-button" onClick={() => navigate("/scan")}>
        <Scan className="scan-icon" />
      </div>
      <ShoppingCart className="nav-icon" onClick={() => navigate("/cart")} />
      <User className="nav-icon" onClick={() => navigate("/user")} />
    </nav>
  )
}

export default BottomNav