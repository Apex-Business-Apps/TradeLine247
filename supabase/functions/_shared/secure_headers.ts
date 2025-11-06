export const secureHeaders: Record<string, string> = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

export function mergeHeaders(
  ...sets: Array<Record<string, string> | undefined>
): Record<string, string> {
  return sets.reduce<Record<string, string>>((acc, cur) => {
    if (!cur) return acc;
    for (const [key, value] of Object.entries(cur)) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

export function withJSON(headers: Record<string, string>): Record<string, string> {
  return {
    ...headers,
    "Content-Type": "application/json",
  };
}

