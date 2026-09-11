import type { MockTask } from "./mock-data";

export const importanceStyles: Record<MockTask["importance"], string> = {
  3: "border-shuiro-500 bg-shuiro-500/10 text-shuiro-500",
  2: "border-kincha-400 bg-kincha-400/10 text-kincha-400",
  1: "border-yugen-500 bg-yugen-500/10 text-yugen-300",
};

export const importanceTagStyles: Record<MockTask["importance"], string> = {
  3: "bg-shuiro-500 text-white",
  2: "bg-kincha-400 text-ink-950",
  1: "bg-yugen-500 text-white",
};

export const importanceLabel: Record<MockTask["importance"], string> = {
  3: "Cao",
  2: "TB",
  1: "Thấp",
};
