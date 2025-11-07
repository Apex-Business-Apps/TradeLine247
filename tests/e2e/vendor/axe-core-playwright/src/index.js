import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const axeScriptPath = require.resolve('axe-core/axe.min.js');

export default class AxeBuilder {
  constructor(options) {
    this.options = options;
  }

  async analyze() {
    const { page } = this.options;
    await page.addScriptTag({ path: axeScriptPath });

    return page.evaluate(async () => {
      const axe = window.axe;
      if (!axe) {
        throw new Error('axe-core failed to load in the browser context');
      }
      return await axe.run();
    });
  }
}
