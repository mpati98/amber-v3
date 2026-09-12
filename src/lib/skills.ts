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
