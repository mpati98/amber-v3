import type { MockTask } from "./mock-data";

export const importanceStyles: Record<MockTask["importance"], string> = {
  3: "border-accent-500 bg-accent-400/10 text-accent-700",
  2: "border-secondary-500 bg-secondary-300/20 text-primary-700",
  1: "border-primary-300 bg-primary-50 text-primary-700",
};

export const importanceTagStyles: Record<MockTask["importance"], string> = {
  3: "bg-accent-500 text-white",
  2: "bg-secondary-500 text-primary-900",
  1: "bg-primary-300 text-primary-900",
};

export const importanceLabel: Record<MockTask["importance"], string> = {
  3: "Cao",
  2: "TB",
  1: "Thấp",
};
