export const TRIP_COMPARISON_TEMPLATE = `Help me compare these trips:

Trip A:
- Destination:
- Dates:
- Budget:

Trip B:
- Destination:
- Dates:
- Budget:

What matters most to me: `;

const COMPARISON_PATTERNS = [
  /\bcompar(?:e|es|ed|ing|ison|isons)\b/i,
  /\bvs\.?\b/i,
  /\bversus\b/i,
  /\bwhich (?:is )?better\b/i,
  /\bwhich (?:one )?should i (?:pick|choose|go|book)/i,
];

export function detectsTripComparison(text: string): boolean {
  if (!text || !text.trim()) return false;
  return COMPARISON_PATTERNS.some((pattern) => pattern.test(text));
}
