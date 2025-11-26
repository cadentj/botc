import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface Message {
  id: string;
  direction: "sent" | "received";
  data: string;
  timestamp: Date;
}

function App() {
  const [serverUrl, setServerUrl] = useState(() => {
    // Default to localhost in dev, or construct from current host
    if (import.meta.env.DEV) {
      return "ws://localhost:3000/ws";
    }
    return `wss://${window.location.hostname.replace("web", "server")}/ws`;
  });
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('{"type": "PING"}');
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const addMessage = useCallback((direction: "sent" | "received", data: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        direction,
        data,
        timestamp: new Date(),
      },
    ]);
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    setStatus("connecting");
    const ws = new WebSocket(serverUrl);

    ws.onopen = () => {
      setStatus("connected");
      addMessage("received", "Connected to server");
    };

    ws.onmessage = (event) => {
      addMessage("received", event.data);
    };

    ws.onclose = () => {
      setStatus("disconnected");
      addMessage("received", "Disconnected from server");
    };

    ws.onerror = () => {
      setStatus("error");
      addMessage("received", "Connection error");
    };

    wsRef.current = ws;
  }, [serverUrl, addMessage]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const sendMessage = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && inputMessage.trim()) {
      wsRef.current.send(inputMessage);
      addMessage("sent", inputMessage);
    }
  }, [inputMessage, addMessage]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const statusColor = {
    disconnected: "#6b7280",
    connecting: "#f59e0b",
    connected: "#10b981",
    error: "#ef4444",
  }[status];

  return (
    <div className="app">
      <header className="header">
        <h1>Blood on the Clocktower</h1>
        <p className="subtitle">Server Connection Test</p>
      </header>

      <div className="connection-panel">
        <div className="url-input-group">
          <input
            type="text"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="WebSocket URL"
            className="url-input"
            disabled={status === "connected" || status === "connecting"}
          />
          <div className="status-indicator" style={{ backgroundColor: statusColor }}>
            {status}
          </div>
        </div>
        <div className="button-group">
          {status !== "connected" ? (
            <button
              onClick={connect}
              disabled={status === "connecting"}
              className="connect-btn"
            >
              {status === "connecting" ? "Connecting..." : "Connect"}
            </button>
          ) : (
            <button onClick={disconnect} className="disconnect-btn">
              Disconnect
            </button>
          )}
        </div>
      </div>

      <div className="messages-panel">
        <div className="messages-header">Messages</div>
        <div className="messages-list">
          {messages.length === 0 ? (
            <div className="empty-state">No messages yet. Connect to the server to begin.</div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.direction}`}>
                <span className="message-direction">
                  {msg.direction === "sent" ? "→" : "←"}
                </span>
                <pre className="message-data">{msg.data}</pre>
                <span className="message-time">
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="send-panel">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder='{"type": "YOUR_MESSAGE"}'
          className="message-input"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.metaKey) {
              sendMessage();
            }
          }}
        />
        <button
          onClick={sendMessage}
          disabled={status !== "connected"}
          className="send-btn"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default App;
