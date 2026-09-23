const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

// Model đã gọi thử trực tiếp GET /v1/models bằng chính GROQ_API_KEY của app này —
// không chỉ tin theo doc, vì doc từng liệt kê "llama-3.3-70b-versatile" nhưng model đó trả về
// 404 "does not exist or you do not have access to it" khi gọi thật với key hiện tại.
// Cả 3 constant dưới đây đã gọi thử THẬT thành công, không chỉ dựa vào việc có trong /v1/models:
// - openai/gpt-oss-120b: gọi thử OK (200), trả lời đúng, phù hợp hội thoại song ngữ.
// - whisper-large-v3-turbo: gọi thử OK (200) với file audio thật.
// - canopylabs/orpheus-v1-english: gọi thử /audio/speech OK (200), trả về WAV thật (voice: austin).
//
// Re-verify 2026-09-23: GET /v1/models trả về 11 model khả dụng cho key này (gồm đủ 3 model
// trên). "groq/compound" và "groq/compound-mini" — có trong lần verify trước — đã BIẾN MẤT khỏi
// danh sách lần này. Danh sách model Groq đổi theo thời gian: đừng tin comment cũ, chạy lại
// GET /v1/models trước khi thêm/tin model nào ngoài 3 constant dưới đây.
const CHAT_MODEL = "openai/gpt-oss-120b";
const WHISPER_MODEL = "whisper-large-v3-turbo";
const TTS_MODEL = "canopylabs/orpheus-v1-english";
const TTS_VOICE = "austin";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const MODE_LABEL: Record<string, string> = {
  CONVERSATION: "trò chuyện tự do hàng ngày",
  EXAM_PREP: "luyện thi (dạng bài thi IELTS/TOEIC)",
  PROFESSIONAL: "tiếng Anh chuyên nghiệp / công sở",
};

export function buildTutorSystemPrompt(mode: string): string {
  const modeLabel = MODE_LABEL[mode] ?? mode;
  return `Bạn là một gia sư tiếng Anh song ngữ (Anh-Việt), thân thiện và kiên nhẫn, đang luyện tập cùng học viên theo hình thức "${modeLabel}".
Quy tắc trả lời:
- Trả lời chủ yếu bằng tiếng Anh phù hợp trình độ học viên, chèn giải thích ngắn bằng tiếng Việt khi học viên mắc lỗi ngữ pháp/từ vựng, hoặc khi câu tiếng Anh khó hiểu.
- Nhẹ nhàng sửa lỗi (ngữ pháp, từ vựng, cách diễn đạt) ngay trong câu trả lời, không ngắt mạch hội thoại.
- Câu trả lời ngắn gọn, tự nhiên như hội thoại thật, luôn khuyến khích học viên nói/viết thêm.`;
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  return { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, ...extra };
}

export async function groqChatCompletion(messages: ChatMessage[]): Promise<string> {
  const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ model: CHAT_MODEL, messages, temperature: 0.7 }),
  });
  if (!res.ok) throw new Error(`Groq chat completion failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content as string;
}

export async function groqTranscribe(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("model", WHISPER_MODEL);

  const res = await fetch(`${GROQ_BASE_URL}/audio/transcriptions`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) throw new Error(`Groq transcription failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.text as string;
}

export async function groqSpeak(text: string): Promise<{ audio: Buffer; contentType: string }> {
  const res = await fetch(`${GROQ_BASE_URL}/audio/speech`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ model: TTS_MODEL, input: text, voice: TTS_VOICE, response_format: "wav" }),
  });
  if (!res.ok) throw new Error(`Groq TTS failed: ${res.status} ${await res.text()}`);
  const arrayBuffer = await res.arrayBuffer();
  return { audio: Buffer.from(arrayBuffer), contentType: res.headers.get("content-type") ?? "audio/wav" };
}

// LLM đôi khi bọc JSON trong ```json ... ``` dù đã dặn không làm vậy — tự bóc trước khi parse.
export function parseJsonFromModel<T>(raw: string): T | null {
  const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "");
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}
