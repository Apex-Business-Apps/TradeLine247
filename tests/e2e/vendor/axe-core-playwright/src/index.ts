import { createRequire } from 'module';
import type { Page } from '@playwright/test';

const require = createRequire(import.meta.url);
const axeScriptPath = require.resolve('axe-core/axe.min.js');

export interface AxeResults {
  violations: Array<{ id: string; [key: string]: unknown }>;
}

export default class AxeBuilder {
  constructor(private readonly options: { page: Page }) {}

  async analyze(): Promise<AxeResults> {
    const { page } = this.options;
    await page.addScriptTag({ path: axeScriptPath });

    return page.evaluate(async () => {
      const axe = (window as unknown as { axe?: { run: () => Promise<AxeResults> } }).axe;
      if (!axe) {
        throw new Error('axe-core failed to load in the browser context');
      }
      return await axe.run();
    });
  }
}
