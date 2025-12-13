 
import { createRequire } from 'module';
import type { Page } from '@playwright/test';

const require = createRequire(import.meta.url);
const axeScriptPath = require.resolve('axe-core/axe.min.js');

export interface AxeResults {
  violations: Array<{ id: string; [key: string]: unknown }>;
}

export interface AxeRunOptions {
  runOnly?: string[] | { type: string; values: string[] };
  rules?: Record<string, any>;
  reporter?: string;
  resultTypes?: string[];
  selectors?: boolean;
  ancestry?: boolean;
  xpath?: boolean;
  absolutePaths?: boolean;
  iframes?: boolean;
  frameWaitTime?: number;
  preload?: boolean;
  performanceTimer?: boolean;
  pingWaitTime?: number;
}

export default class AxeBuilder {
  private tags: string[] = [];
  private rules: Record<string, any> = {};
  private runOnly: string[] | { type: string; values: string[] } | undefined;
  private disabledRules: string[] = [];
  private options: AxeRunOptions = {};

  constructor(private readonly pageOptions: { page: Page }) {}

  /**
   * Limit analysis to only the specified WCAG guidelines
   */
  withTags(tags: string[]): this {
    this.tags = tags;
    return this;
  }

  /**
   * Set specific rules to run
   */
  withRules(rules: Record<string, any>): this {
    this.rules = rules;
    return this;
  }

  /**
   * Limit analysis to only the specified rules
   */
  withOnly(runOnly: string[] | { type: string; values: string[] }): this {
    this.runOnly = runOnly;
    return this;
  }

  /**
   * Disable specific rules
   */
  disableRules(rules: string[]): this {
    this.disabledRules = rules;
    return this;
  }

  /**
   * Set additional options for axe.run()
   */
  options(options: AxeRunOptions): this {
    this.options = { ...this.options, ...options };
    return this;
  }

  async analyze(): Promise<AxeResults> {
    const { page } = this.pageOptions;
    await page.addScriptTag({ path: axeScriptPath });

    // Build the axe.run() configuration
    const axeConfig: any = {};

    if (this.runOnly) {
      axeConfig.runOnly = this.runOnly;
    } else if (this.tags.length > 0) {
      // Convert tags to runOnly format
      axeConfig.runOnly = { type: 'tag', values: this.tags };
    }

    if (Object.keys(this.rules).length > 0) {
      axeConfig.rules = this.rules;
    }

    // Apply disabled rules
    if (this.disabledRules.length > 0) {
      axeConfig.rules = axeConfig.rules || {};
      this.disabledRules.forEach(rule => {
        axeConfig.rules[rule] = { enabled: false };
      });
    }

    // Merge additional options
    Object.assign(axeConfig, this.options);

    return page.evaluate(async (config) => {
      const axe = (window as unknown as { axe?: { run: (config?: any) => Promise<AxeResults> } }).axe;
      if (!axe) {
        throw new Error('axe-core failed to load in the browser context');
      }
      return await axe.run(config);
    }, axeConfig);
  }
}
