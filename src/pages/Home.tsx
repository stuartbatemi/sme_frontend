import { useNavigate } from "react-router-dom"
import { DarShowcase } from "../components/sections/dar-showcase"
import { ChatBotWidget } from "../components/ui/chat-bot-widget"
import { useAuth } from "../context/AuthContext"

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const goNext = () => (user ? navigate("/advisor") : navigate("/register"))

  return (
    <div style={{ background: "var(--clr-bg)", color: "var(--clr-text)" }}>
      <DarShowcase />
      <ChatBotWidget onGetStarted={goNext} />
    </div>
  )
}
