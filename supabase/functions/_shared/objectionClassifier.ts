type ObjectionType = 'price' | 'trust' | 'competitor' | 'timing' | 'none';

const patterns: Record<ObjectionType, RegExp[]> = {
  price: [/expensive/i, /price/i, /cost/i, /too much/i, /afford/i],
  trust: [/trust/i, /legit/i, /scam/i, /concern/i],
  competitor: [/other company/i, /another provider/i, /switch/i, /already with/i],
  timing: [/later/i, /busy/i, /not now/i, /call back/i, /another time/i],
  none: []
};

export function classifyObjection(text: string): ObjectionType {
  if (!text) return 'none';
  for (const [type, regexes] of Object.entries(patterns) as [ObjectionType, RegExp[]][]) {
    if (type === 'none') continue;
    if (regexes.some((r) => r.test(text))) return type;
  }
  return 'none';
}

export function getObjectionContext(type: ObjectionType): string {
  switch (type) {
    case 'price':
      return 'If caller raises price concerns: acknowledge budget, offer a lighter option and a standard option, and ask one clarifying question about priorities. Stay factual—no unverified claims.';
    case 'trust':
      return 'If caller questions trust/safety: acknowledge concern, offer to share references or schedule a quick follow-up with a human, and keep responses transparent. No unverified claims.';
    case 'competitor':
      return 'If caller mentions another provider: stay neutral, ask what matters most to them, and offer a concise option that respects their preference. Do not disparage competitors.';
    case 'timing':
      return 'If caller defers timing: propose a specific callback window and a lightweight next step. Keep it short and respectful.';
    default:
      return '';
  }
}

