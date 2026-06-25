// Console credits banner — prints the team behind the Bajaj AI Platform to the
// browser devtools console on load. Purely cosmetic; no runtime behaviour.

const MADE_BY = [
  "Diwakar Adhikari Chetri",
  "Abhishek Gurjar",
  "Yashraj Lawate",
  "Utkarsh Das",
  "Tanish Jagtap",
] as const;

/** Logs a boxed "MADE BY" credits banner to the console. Runs once on load. */
export function logCredits(): void {
  const title = "MADE BY";
  const rows = MADE_BY.map((name) => `- ${name}`);
  // 2-space gutter on each side of the longest row.
  const inner = Math.max(title.length, ...rows.map((r) => r.length)) + 4;

  const rule = (l: string, r: string) => `${l}${"─".repeat(inner)}${r}`;
  const center = (s: string) => {
    const total = inner - s.length;
    const left = Math.floor(total / 2);
    return `│${" ".repeat(left)}${s}${" ".repeat(total - left)}│`;
  };
  const item = (s: string) => {
    const body = `  ${s}`;
    return `│${body}${" ".repeat(inner - body.length)}│`;
  };

  const box = [
    rule("┌", "┐"),
    center(title),
    rule("├", "┤"),
    ...rows.map(item),
    rule("└", "┘"),
  ].join("\n");

  console.log(`%c${box}`, "color:#0072ce;font-family:monospace;font-size:12px;line-height:1.15;");
}
