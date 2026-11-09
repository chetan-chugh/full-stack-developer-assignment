import { FormEvent, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, getErrorMessage } from '../services/api';

// The typing dots stay visible at least this long, even if the server replies instantly
const MIN_TYPING_MS = 800;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const dotClass = 'size-2 animate-bounce rounded-full bg-[var(--muted)]';

function TypingIndicator() {
  return (
    <div
      className="flex items-center gap-1.5 self-start rounded-[14px] rounded-bl-[4px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5"
      role="status"
      aria-label="Assistant is typing"
    >
      <span className={dotClass} />
      <span className={`${dotClass} [animation-delay:150ms]`} />
      <span className={`${dotClass} [animation-delay:300ms]`} />
    </div>
  );
}

export default function ChatPage() {
  const { chatMessages, chatSessionId, addChatMessage } = useAuth();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll down when a message arrives or the typing indicator appears
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, sending]);

  const handleSend = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const requestSessionId = chatSessionId;
    addChatMessage({ from: 'user', text }, requestSessionId);
    setInput('');
    setSending(true);
    try {
      const [{ reply }] = await Promise.all([api.sendMessage(text), wait(MIN_TYPING_MS)]);
      addChatMessage({ from: 'bot', text: reply }, requestSessionId);
    } catch (err) {
      addChatMessage(
        { from: 'bot', text: `Error: ${getErrorMessage(err)}`, isError: true },
        requestSessionId,
      );
    } finally {
      setSending(false);
    }
  };

  return (
   <div className="card fixed bottom-[var(--gap)] left-[calc(var(--sidebar-width)+var(--gap))] right-[var(--gap)] top-[var(--gap)] flex flex-col max-[860px]:static max-[860px]:m-3 max-[860px]:h-auto">
      <h1 className="mb-3 text-xl">Chatbot</h1>
      <div className="flex min-h-[200px] flex-1 flex-col gap-2 overflow-y-auto rounded-[10px] bg-[var(--bg)] p-3.5 max-[860px]:h-[60dvh] max-[860px]:flex-none">
        {chatMessages.map((m, i) => (
          <div
            key={i}
            className={`w-fit max-w-[75%] break-words whitespace-pre-wrap border px-3.5 py-[9px] ${
              m.from === 'user'
                ? 'self-end rounded-[14px] rounded-br-[4px] border-[var(--primary)] bg-[var(--primary)] text-white'
                : `self-start rounded-[14px] rounded-bl-[4px] border-[var(--border)] bg-[var(--surface)] ${
                    m.isError ? 'text-[var(--danger)]' : ''
                  }`
            }`}
          >
            {m.text}
          </div>
        ))}
        {sending && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
      <form className="mt-3 flex gap-2" onSubmit={handleSend}>
        <input
          className="m-0"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          maxLength={500}
        />
        <button type="submit" disabled={sending}>Send</button>
      </form>
    </div>
  );
}