"use client";

type Props = {
  content: string;
  onToggle: (newContent: string) => void;
};

export default function ChecklistView({ content, onToggle }: Props) {
  const lines = content.split("\n");

  function toggleLine(index: number) {
    const newLines = lines.map((line, i) => {
      if (i !== index) return line;
      if (/-\s*\[ \]/.test(line)) return line.replace(/\[ \]/, "[x]");
      if (/-\s*\[[xX]\]/.test(line)) return line.replace(/\[[xX]\]/, "[ ]");
      return line;
    });
    onToggle(newLines.join("\n"));
  }

  return (
    <ul className="space-y-2">
      {lines.map((line, i) => {
        const match = line.match(/^\s*-\s*\[([ xX])\]\s*(.*)/);
        if (!match) return null;
        const checked = match[1].toLowerCase() === "x";
        return (
          <li key={i} className="flex items-center gap-2">
            <button
              onClick={() => toggleLine(i)}
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-sm border text-xs ${
                checked ? "border-kincha-400 bg-kincha-400 text-ink-950" : "border-white/30 text-transparent"
              }`}
            >
              ✓
            </button>
            <span className={checked ? "text-white/40 line-through" : "text-white/90"}>{match[2]}</span>
          </li>
        );
      })}
    </ul>
  );
}
