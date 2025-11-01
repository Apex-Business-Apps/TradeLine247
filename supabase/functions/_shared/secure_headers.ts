export const secureHeaders = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

export function mergeHeaders(...sets: Array<Record<string, string>>): Record<string, string> {
  return sets.reduce((acc, cur) => Object.assign(acc, cur), {});
}

