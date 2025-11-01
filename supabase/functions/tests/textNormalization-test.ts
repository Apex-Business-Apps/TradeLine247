import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { normalizeTextForEmbedding, TRAD_TO_SIMP } from "../_shared/textNormalization.ts";

Deno.test('traditional to simplified mapping has unique keys', () => {
  const keys = Object.keys(TRAD_TO_SIMP);
  const uniqueKeys = new Set(keys);
  assertEquals(keys.length, uniqueKeys.size);
});

Deno.test('normalizeTextForEmbedding converts traditional chinese samples', () => {
  const sampleOne = normalizeTextForEmbedding('繁體語學', 'zh');
  assertEquals(sampleOne.normalized, '繁体语学');

  const sampleTwo = normalizeTextForEmbedding('電話網際服務', 'zh');
  assertEquals(sampleTwo.normalized, '电话网际服務');
});
