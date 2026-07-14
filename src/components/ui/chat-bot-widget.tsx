import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Sparkles } from "lucide-react"
import { cn } from "../../lib/utils"

interface ChatMessage {
  role: "bot" | "user"
  text: string
}

const INTRO: ChatMessage = {
  role: "bot",
  text: "Habari! I'm the ORin assistant. Ask me about starting a business in Dar es Salaam — I can point you to the right path.",
}

/**
 * Floating chat launcher + panel for the hero. This is a real,
 * functional widget shell (open/close, message list, input) — it
 * is not wired to a live AI backend yet, so replies are canned
 * guidance rather than a faked model response.
 */
export function ChatBotWidget({ onGetStarted }: { onGetStarted?: () => void }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([INTRO])
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, open])

  function send() {
    const text = input.trim()
    if (!text) return
    setMessages((m) => [
      ...m,
      { role: "user", text },
      {
        role: "bot",
        text: "I'm a simple guide for now — sign up free and get a real, data-backed answer in seconds. Click \"Get Free Advice\" above to start!",
      },
    ])
    setInput("")
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[380px] w-[300px] flex-col overflow-hidden rounded-2xl border border-white/15 bg-neutral-900/90 shadow-2xl backdrop-blur-xl sm:w-[340px]">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="font-display text-sm font-semibold text-white">ORin Assistant</span>
            <button
              onClick={() => setOpen(false)}
              className="ml-auto rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                  m.role === "bot"
                    ? "bg-white/10 text-white/90"
                    : "ml-auto bg-accent text-accent-foreground"
                )}
              >
                {m.text}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-white/10 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask something..."
              className="flex-1 rounded-full bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              onClick={send}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition hover:brightness-105"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-[0_8px_24px_rgba(232,168,56,0.45)] transition hover:scale-105 active:scale-95"
        aria-label={open ? "Close assistant" : "Open assistant"}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  )
}
