"use client";
import { streamPost } from "@/lib/streamClient";
import { useState, useRef, useEffect, useCallback } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
};

const TOPICS = [
  {
    id: "crops",
    label: "Crop advice",
    icon: "🌽",
    prompt: "What crops should I consider planting this season?",
  },
  {
    id: "livestock",
    label: "Livestock",
    icon: "🐄",
    prompt: "How do I keep my livestock healthy during dry season?",
  },
  {
    id: "weather",
    label: "Weather & climate",
    icon: "🌧️",
    prompt: "How should I adapt my farming to irregular rainfall?",
  },
  {
    id: "market",
    label: "Market prices",
    icon: "📈",
    prompt: "When is the best time to sell my maize crop?",
  },
  {
    id: "soil",
    label: "Soil health",
    icon: "🌱",
    prompt: "How do I improve my soil fertility without expensive fertilizers?",
  },
  {
    id: "pests",
    label: "Pests & disease",
    icon: "🐛",
    prompt: "How do I identify and treat fall armyworm?",
  },
];

const SUGGESTIONS = [
  "What's the best time to plant maize in Kenya?",
  "My tomatoes have yellow leaves — what's wrong?",
  "How do I prevent foot-and-mouth disease in cattle?",
  "What's the market price trend for avocados?",
];

function TypingIndicator() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "14px 18px",
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#7C9A5E",
            display: "inline-block",
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function Message({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 18,
        gap: 10,
        alignItems: "flex-end",
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #4A7C3F, #7C9A5E)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(74,124,63,0.25)",
          }}
        >
          🌿
        </div>
      )}
      <div
        style={{
          maxWidth: "72%",
          padding: "13px 17px",
          borderRadius: isUser ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
          background: isUser
            ? "linear-gradient(135deg, #4A7C3F, #5E9A50)"
            : "rgba(255,255,255,0.08)",
          border: isUser ? "none" : "1px solid rgba(255,255,255,0.1)",
          color: isUser ? "#fff" : "#E8EDE4",
          fontSize: 14.5,
          lineHeight: 1.65,
          boxShadow: isUser
            ? "0 3px 12px rgba(74,124,63,0.3)"
            : "0 2px 8px rgba(0,0,0,0.15)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {msg.content}
        {msg.streaming && (
          <span
            style={{
              display: "inline-block",
              width: 2,
              height: "1em",
              background: "#7C9A5E",
              marginLeft: 2,
              verticalAlign: "text-bottom",
              animation: "blink 1s step-end infinite",
            }}
          />
        )}
      </div>
      {isUser && (
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            flexShrink: 0,
          }}
        >
          👤
        </div>
      )}
    </div>
  );
}

export default function AgroAdvisor() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      setLoading(true);
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text,
      };
      const assistantId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        streaming: true,
      };
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setInput("");
      setShowWelcome(false);
      abortRef.current = new AbortController();
      try {
        await streamPost(
          "/advisor/chat",
          {
            messages: [...messages, userMessage].map(({ role, content }) => ({
              role,
              content,
            })),
          },
          (chunk: string) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + chunk } : m,
              ),
            );
          },
          abortRef.current.signal,
        );
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, streaming: false } : m,
          ),
        );
      } catch (error) {
        console.error(error);
        // Optionally handle error, e.g., show error message
      } finally {
        setLoading(false);
      }
    },
    [messages, loading],
  );

  const handleTopicClick = (topic: (typeof TOPICS)[number]) => {
    setActiveTopic(topic.id);
    sendMessage(topic.prompt);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1A1F14",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-8px)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .topic-chip:hover{background:rgba(124,154,94,0.2)!important;border-color:rgba(124,154,94,0.6)!important;transform:translateY(-1px)}
        .send-btn:hover:not(:disabled){background:#5E9A50!important;transform:scale(1.05)}
        .send-btn:disabled{opacity:0.4;cursor:not-allowed}
        .suggestion-pill:hover{background:rgba(124,154,94,0.15)!important;border-color:rgba(124,154,94,0.5)!important}
        textarea:focus{outline:none}
        .msg-enter{animation:fadeUp 0.3s ease forwards}
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:rgba(124,154,94,0.3);border-radius:4px}
      `}</style>

      <div
        style={{
          position: "fixed",
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle,rgba(74,124,63,0.12) 0%,transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: -80,
          left: -80,
          width: 350,
          height: 350,
          borderRadius: "50%",
          background:
            "radial-gradient(circle,rgba(139,109,56,0.1) 0%,transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(26,31,20,0.95)",
          backdropFilter: "blur(10px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "linear-gradient(135deg,#2D5A1B,#4A7C3F)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              boxShadow: "0 2px 10px rgba(74,124,63,0.4)",
            }}
          >
            🌿
          </div>
          <div>
            <div
              style={{
                color: "#E8EDE4",
                fontSize: 17,
                fontWeight: 600,
                letterSpacing: "0.3px",
              }}
            >
              Agro Advisor
            </div>
            <div
              style={{
                color: "#7C9A5E",
                fontSize: 12,
                letterSpacing: "0.5px",
                fontFamily: "monospace",
              }}
            >
              ● AI-powered farming intelligence
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => {
              setMessages([]);
              setShowWelcome(true);
              setActiveTopic(null);
            }}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              color: "#9BA89A",
              fontSize: 12,
              padding: "6px 12px",
              cursor: "pointer",
              fontFamily: "monospace",
              letterSpacing: "0.5px",
            }}
          >
            NEW CHAT
          </button>
        )}
      </div>

      <div
        style={{
          padding: "12px 20px",
          display: "flex",
          gap: 8,
          overflowX: "auto",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          scrollbarWidth: "none",
        }}
      >
        {TOPICS.map((topic) => (
          <button
            key={topic.id}
            className="topic-chip"
            onClick={() => handleTopicClick(topic)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              border: `1px solid ${activeTopic === topic.id ? "rgba(124,154,94,0.7)" : "rgba(255,255,255,0.1)"}`,
              background:
                activeTopic === topic.id
                  ? "rgba(124,154,94,0.18)"
                  : "rgba(255,255,255,0.04)",
              color: activeTopic === topic.id ? "#A8C98A" : "#9BA89A",
              fontSize: 13,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 14 }}>{topic.icon}</span>
            {topic.label}
          </button>
        ))}
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 20px",
          maxWidth: 780,
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        {showWelcome && messages.length === 0 && (
          <div style={{ animation: "fadeUp 0.5s ease forwards" }}>
            <div
              style={{ textAlign: "center", marginBottom: 40, paddingTop: 20 }}
            >
              <div style={{ fontSize: 52, marginBottom: 16 }}>🌾</div>
              <h1
                style={{
                  color: "#E8EDE4",
                  fontSize: 28,
                  fontWeight: 400,
                  margin: "0 0 10px",
                  letterSpacing: "0.5px",
                }}
              >
                Good day, Farmer
              </h1>
              <p
                style={{
                  color: "#6B7A64",
                  fontSize: 15,
                  maxWidth: 420,
                  margin: "0 auto",
                  lineHeight: 1.7,
                }}
              >
                Ask me anything about your crops, livestock, weather patterns,
                or market prices.
              </p>
            </div>
            <div style={{ marginBottom: 32 }}>
              <div
                style={{
                  color: "#5A6654",
                  fontSize: 11,
                  letterSpacing: "1.5px",
                  textAlign: "center",
                  marginBottom: 14,
                  fontFamily: "monospace",
                }}
              >
                QUICK QUESTIONS
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  justifyContent: "center",
                }}
              >
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    className="suggestion-pill"
                    onClick={() => sendMessage(s)}
                    style={{
                      padding: "9px 16px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.09)",
                      background: "rgba(255,255,255,0.04)",
                      color: "#C5D4BC",
                      fontSize: 13.5,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      fontFamily: "inherit",
                      lineHeight: 1.4,
                      textAlign: "left",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2,1fr)",
                gap: 12,
                maxWidth: 520,
                margin: "0 auto",
              }}
            >
              {[
                {
                  icon: "🌽",
                  title: "Crop Planning",
                  desc: "Planting schedules, varieties & soil prep",
                },
                {
                  icon: "🐄",
                  title: "Livestock Care",
                  desc: "Health, feeding & disease prevention",
                },
                {
                  icon: "🌧️",
                  title: "Weather Insights",
                  desc: "Adapting to rainfall & climate changes",
                },
                {
                  icon: "📊",
                  title: "Market Intel",
                  desc: "When to sell for maximum profit",
                },
              ].map((f, i) => (
                <div
                  key={i}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                  }}
                >
                  <span style={{ fontSize: 22 }}>{f.icon}</span>
                  <div>
                    <div
                      style={{
                        color: "#C5D4BC",
                        fontSize: 13,
                        fontWeight: 600,
                        marginBottom: 3,
                      }}
                    >
                      {f.title}
                    </div>
                    <div
                      style={{
                        color: "#5A6654",
                        fontSize: 12,
                        lineHeight: 1.5,
                      }}
                    >
                      {f.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={msg.id || i} className="msg-enter">
            <Message msg={msg} />
          </div>
        ))}

        {loading && messages[messages.length - 1]?.content === "" && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 10,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#4A7C3F,#7C9A5E)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              🌿
            </div>
            <div
              style={{
                borderRadius: "4px 18px 18px 18px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <TypingIndicator />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(26,31,20,0.97)",
          backdropFilter: "blur(10px)",
          padding: "16px 20px 20px",
        }}
      >
        <div
          style={{
            maxWidth: 780,
            margin: "0 auto",
            display: "flex",
            gap: 10,
            alignItems: "flex-end",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            padding: "10px 10px 10px 16px",
            transition: "border-color 0.2s ease",
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about crops, livestock, weather or markets..."
            rows={1}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              color: "#E8EDE4",
              fontSize: 15,
              fontFamily: "inherit",
              resize: "none",
              lineHeight: 1.6,
              maxHeight: 140,
              overflowY: "auto",
              padding: "2px 0",
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 140) + "px";
            }}
          />
          <button
            className="send-btn"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "#4A7C3F",
              border: "none",
              color: "#fff",
              fontSize: 17,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              flexShrink: 0,
            }}
          >
            ↑
          </button>
        </div>
        <div
          style={{
            textAlign: "center",
            marginTop: 8,
            color: "#3D4B38",
            fontSize: 11,
            fontFamily: "monospace",
            letterSpacing: "0.5px",
          }}
        >
          AGROSENSE ADVISOR · POWERED BY CLAUDE
        </div>
      </div>
    </div>
  );
}
