"use client"
import { useNavigate } from "react-router-dom"
import { Home, History, ShoppingCart, User, Scan, Edit3, Bot } from "lucide-react"
import "./styles.css"

const HomePage = () => {
  const navigate = useNavigate()

  const featureCards = [
    {
      title: "Scan",
      description: "Ingredients using Barcode or OCR ...",
      icon: <Scan className="icon" />,
      className: "scan",
      onClick: () => navigate("/scan"),
    },
    {
      title: "Edit",
      description: "Edit the Diabetes level",
      icon: <Edit3 className="icon" />,
      className: "edit",
      onClick: () => navigate("/edit"),
    },
    {
      title: "Nutri Cart",
      description: "Compare the ingredients of two products",
      icon: <ShoppingCart className="icon" />, // Changed icon to ShoppingCart
      className: "convert",
      onClick: () => navigate("/compare"),
    },
    {
      title: "Ask AI",
      description: "Ask to You AI Friend",
      icon: <Bot className="icon" />,
      className: "ask-ai",
      onClick: () => navigate("/askai"),
    },
  ]

  const handleCartClick = () => {
    navigate("/cart")
  }

  const handleScanClick = () => {
    navigate("/scan")
  }

  const handleHistoryClick = () => {
    navigate("/notifications")
  }

  const handleUserClick = () => {
    navigate("/user")
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo-container">
          <div className="logo-icon">
            <img src="/images/image1.png" />
          </div>
        </div>
      </header>
      <div className="quotediv">
      <div className="quote" >
        Empowering Healthier Choices
      </div>
      <div className="quote" >
        For A Better Life
      </div>
      </div>
      

      <main className="main-content">
        {/* Feature Grid */}
        <div className="feature-grid">
          {featureCards.map((card, index) => (
            <div key={index} className={`feature-card ${card.className}`} onClick={card.onClick}>
              <div className="icon-container">{card.icon}</div>
              <h3 className="card-title">{card.title}</h3>
              <p className="card-description">{card.description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <Home className="nav-icon" />
        <History className="nav-icon" onClick={handleHistoryClick} />
        <div className="scan-button" onClick={handleScanClick}>
          <Scan className="scan-icon" />
        </div>
        <ShoppingCart className="nav-icon" onClick={handleCartClick} />
        <User className="nav-icon" onClick={handleUserClick}/>
      </nav>
    </div>
  )
}
export default HomePage