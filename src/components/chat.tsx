/**
 * Chat — message list + composer
 * ──────────────────────────────
 */
import * as React from "react";
import type { ChatProps, ChatMessage } from "../components";
import { cx } from "../internal/cx";
import { Avatar } from "./data-display";

export function Chat(props: ChatProps): React.ReactElement {
  const {
    messages, streaming = false,
    placeholder = "Send a message…",
    onSend, onStop, suggestions,
    className, style, id,
  } = props;

  const [draft, setDraft] = React.useState("");
  const [files, setFiles] = React.useState<File[]>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, streaming]);

  const send = () => {
    if (!draft.trim() && files.length === 0) return;
    onSend?.(draft.trim(), files);
    setDraft("");
    setFiles([]);
  };

  return (
    <div id={id} className={cx("rcs-chat", className)} style={style}>
      <div ref={scrollRef} className="rcs-chat-messages">
        {messages.map((m: ChatMessage) => (
          <div key={m.id} className={cx("rcs-chat-msg", `rcs-chat-msg--${m.role}`)}>
            {m.role === "assistant" && <Avatar size="sm" initials="AI" />}
            <div>
              <div className="rcs-chat-bubble">{m.content}</div>
              {m.status && m.status !== "sent" && (
                <div className="rcs-chat-msg-status">{m.status === "streaming" ? "▍" : m.status}</div>
              )}
            </div>
            {m.role === "user" && <Avatar size="sm" initials="You" />}
          </div>
        ))}
      </div>

      {suggestions && suggestions.length > 0 && (
        <div className="rcs-chat-suggestions">
          {suggestions.map((s) => (
            <button key={s} type="button" className="rcs-chat-suggestion" onClick={() => onSend?.(s, [])}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="rcs-chat-composer">
        <textarea
          className="rcs-chat-input"
          placeholder={placeholder}
          value={draft}
          rows={1}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        {streaming ? (
          <button className="rcs-button rcs-button--secondary rcs-button--md" onClick={onStop}>
            Stop
          </button>
        ) : (
          <button className="rcs-button rcs-button--primary rcs-button--md" onClick={send} disabled={!draft.trim()}>
            Send
          </button>
        )}
      </div>
    </div>
  );
}
