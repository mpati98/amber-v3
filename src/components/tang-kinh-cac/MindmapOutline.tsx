type OutlineNode = { label: string; children: OutlineNode[] };

export function parseOutline(md: string): OutlineNode[] {
  const lines = md.split("\n").filter((l) => l.trim().length > 0);
  const root: OutlineNode = { label: "root", children: [] };
  const stack: { level: number; node: OutlineNode }[] = [{ level: 0, node: root }];
  let lastHeadingLevel = 0;

  for (const raw of lines) {
    const headingMatch = raw.match(/^(#{1,6})\s+(.*)/);
    const bulletMatch = raw.match(/^(\s*)-\s*(?:\[[ xX]\]\s*)?(.*)/);

    let level: number;
    let label: string;

    if (headingMatch) {
      level = headingMatch[1].length;
      label = headingMatch[2];
      lastHeadingLevel = level;
    } else if (bulletMatch) {
      const indent = bulletMatch[1].length;
      level = lastHeadingLevel + 1 + Math.floor(indent / 2);
      label = bulletMatch[2];
    } else {
      continue;
    }

    while (stack.length > 1 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    const node: OutlineNode = { label, children: [] };
    stack[stack.length - 1].node.children.push(node);
    stack.push({ level, node });
  }

  return root.children;
}

const DEPTH_COLORS = ["text-kincha-400", "text-yugen-300", "text-white/70"];

export function OutlineTree({ nodes, depth = 0 }: { nodes: OutlineNode[]; depth?: number }) {
  return (
    <ul className={depth === 0 ? "" : "ml-4 border-l border-white/10 pl-4"}>
      {nodes.map((node, i) => (
        <li key={i} className="my-1.5">
          <span className={`font-serif-display ${depth === 0 ? "text-lg" : "text-sm"} ${DEPTH_COLORS[Math.min(depth, 2)]}`}>
            {depth === 0 ? "◆ " : "· "}
            {node.label}
          </span>
          {node.children.length > 0 && <OutlineTree nodes={node.children} depth={depth + 1} />}
        </li>
      ))}
    </ul>
  );
}
