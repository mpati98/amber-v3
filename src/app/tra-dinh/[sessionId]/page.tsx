"use client";

import { useCallback, useEffect, useRef, useState, use } from "react";
import Link from "next/link";

type Message = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
};

type Session = {
  id: string;
  name: string;
  archivedAt: string | null;
  practiceDetails: { mode: string; summary: string | null } | null;
  practiceMessages: Message[];
};

const MODE_LABEL: Record<string, string> = {
  CONVERSATION: "Trò chuyện tự do",
  EXAM_PREP: "Luyện thi",
  PROFESSIONAL: "Chuyên nghiệp",
};

export default function PracticeSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);

  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/tra-dinh/sessions/${sessionId}`);
    if (!res.ok) return;
    const data: Session = await res.json();
    setSessionData(data);
    setMessages(data.practiceMessages);
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setInput("");
    setSendError(null);
    try {
      const res = await fetch(`/api/tra-dinh/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error(`send failed: ${res.status}`);
      const { userMessage, assistantMessage } = await res.json();
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
    } catch {
      setInput(content);
      setSendError("Không gửi được tin nhắn — thử lại nhé.");
    } finally {
      setSending(false);
    }
  };

  const endSession = async () => {
    setEnding(true);
    try {
      const res = await fetch(`/api/tra-dinh/sessions/${sessionId}`, { method: "PATCH" });
      if (!res.ok) throw new Error("end failed");
      const updated = await res.json();
      setSessionData((prev) => (prev ? { ...prev, ...updated } : prev));
    } finally {
      setEnding(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setTranscribing(true);
        try {
          const form = new FormData();
          form.append("file", blob, "recording.webm");
          const res = await fetch("/api/tra-dinh/transcribe", { method: "POST", body: form });
          if (res.ok) {
            const { text } = await res.json();
            setInput((prev) => (prev ? `${prev} ${text}` : text));
          }
        } finally {
          setTranscribing(false);
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      // Người dùng từ chối quyền mic hoặc trình duyệt không hỗ trợ — im lặng bỏ qua, họ vẫn gõ tay được.
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const playMessage = async (message: Message) => {
    if (speakingId) return;
    setSpeakingId(message.id);
    try {
      const res = await fetch("/api/tra-dinh/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message.content }),
      });
      if (!res.ok) throw new Error("speak failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setSpeakingId(null);
      };
      await audio.play();
    } catch {
      setSpeakingId(null);
    }
  };

  if (!sessionData) {
    return (
      <main className="min-h-screen bg-ink-950 p-4 text-white sm:p-6 lg:p-8">
        <p className="font-sans text-[12px] text-white/40">Đang tải...</p>
      </main>
    );
  }

  const isArchived = !!sessionData.archivedAt;

  return (
    <main className="flex min-h-screen flex-col bg-ink-950 text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6">
        <div>
          <Link href="/tra-dinh" className="font-sans text-[11px] text-kincha-400 hover:text-kincha-200">
            ← Trà Đình
          </Link>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="font-serif-display text-lg font-semibold text-white">{sessionData.name}</h1>
            <span className="rounded-sm border border-white/15 px-2 py-0.5 font-sans text-[10px] text-white/50">
              {MODE_LABEL[sessionData.practiceDetails?.mode ?? ""] ?? sessionData.practiceDetails?.mode}
            </span>
          </div>
        </div>
        {!isArchived ? (
          <button
            onClick={endSession}
            disabled={ending}
            className="rounded-sm border border-shuiro-500/40 px-3 py-1.5 font-sans text-[12px] text-shuiro-500 hover:bg-shuiro-500/10"
          >
            {ending ? "Đang kết thúc..." : "Kết thúc buổi"}
          </button>
        ) : (
          <span className="rounded-sm border border-white/15 px-2 py-1 font-sans text-[11px] text-white/50">Đã kết thúc</span>
        )}
      </header>

      {isArchived && sessionData.practiceDetails?.summary && (
        <div className="mx-4 mt-4 rounded-sm border border-kincha-400/30 bg-kincha-400/5 p-3 sm:mx-6">
          <p className="mb-1 font-sans text-[11px] font-medium text-kincha-400">Tóm tắt buổi luyện</p>
          <p className="font-sans text-[13px] text-white/80">{sessionData.practiceDetails.summary}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {messages.length === 0 && (
            <p className="text-center font-sans text-[12px] text-white/30">Bắt đầu trò chuyện bằng tiếng Anh nhé!</p>
          )}
          {messages.map((m) => {
            const isUser = m.role === "USER";
            return (
              <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-sm border px-3 py-2 ${
                    isUser ? "border-kincha-400/30 bg-kincha-400/10" : "border-white/10 bg-white/5"
                  }`}
                >
                  <p className="whitespace-pre-wrap font-sans text-[13px] text-white">{m.content}</p>
                  {!isUser && (
                    <button
                      onClick={() => playMessage(m)}
                      disabled={speakingId === m.id}
                      className="mt-1 font-sans text-[11px] text-kincha-400 hover:underline disabled:opacity-50"
                    >
                      {speakingId === m.id ? "Đang phát..." : "🔊 Phát"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {!isArchived && (
        <div className="border-t border-white/10 px-4 py-3 sm:px-6">
          {sendError && (
            <p className="mx-auto mb-2 max-w-2xl font-sans text-[11px] text-shuiro-500">{sendError}</p>
          )}
          <div className="mx-auto flex max-w-2xl items-center gap-2">
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={transcribing}
              className={`shrink-0 rounded-full border px-3 py-2 font-sans text-sm transition ${
                recording
                  ? "border-shuiro-500 bg-shuiro-500/20 text-shuiro-500"
                  : "border-white/15 text-white/60 hover:border-kincha-400/50 hover:text-kincha-200"
              }`}
            >
              {recording ? "⏹" : transcribing ? "…" : "🎙️"}
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Nhập câu tiếng Anh của bạn..."
              className="h-9 flex-1 rounded-sm border border-white/15 bg-white/5 px-3 text-[13px] text-white placeholder:text-white/30 outline-none focus-visible:border-kincha-400/50"
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              className="shrink-0 rounded-sm bg-kincha-400 px-4 py-2 font-sans text-[13px] font-medium text-ink-950 hover:bg-kincha-400/80 disabled:opacity-50"
            >
              {sending ? "..." : "Gửi"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
