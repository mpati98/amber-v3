export const SKILLS = ["GRAMMAR", "VOCABULARY", "LISTENING", "SPEAKING", "READING", "WRITING"] as const;
export type Skill = (typeof SKILLS)[number];

export const SKILL_LABEL: Record<Skill, string> = {
  GRAMMAR: "Ngữ pháp",
  VOCABULARY: "Từ vựng",
  LISTENING: "Nghe",
  SPEAKING: "Nói",
  READING: "Đọc",
  WRITING: "Viết",
};

const VALID_CEFR = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);

// cefr_level là varchar(4): chỉ nhận đúng 6 bậc CEFR, mọi giá trị khác từ LLM
// ("Upper-Intermediate", "B1/B2+", số...) coi như không chấm được → null, để
// không lỗi 500 / rollback cả request vì 1 nhãn sai định dạng.
export function validCefrLevel(value: unknown): string | null {
  return typeof value === "string" && VALID_CEFR.has(value) ? value : null;
}
