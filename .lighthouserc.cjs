/* CJS config compatible with package.json { "type": "module" } */
module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      url: [process.env.LHCI_URL || "/"],
      numberOfRuns: 1,
      settings: {
        chromeFlags: "--no-sandbox --headless --disable-dev-shm-usage",
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      },
    },
    assert: {
      assertions: {
        // Performance: warn at 60%, fail below
        "categories:performance": ["warn", { "minScore": 0.60 }],

        // Accessibility: warn at 50% (advisory for CI)
        "categories:accessibility": ["warn", { "minScore": 0.50 }],

        // SEO: warn at 85%
        "categories:seo": ["warn", { "minScore": 0.85 }],

        // Best Practices: warn at 80%
        "categories:best-practices": ["warn", { "minScore": 0.80 }],

        // Critical accessibility issues (warnings)
        "button-name": "warn",
        "color-contrast": "warn",
        "label": "warn",
        "link-name": "warn",

        // Performance hints (warnings)
        "unused-javascript": "warn",
        "unused-css-rules": "warn",
        "offscreen-images": "warn",
        "render-blocking-resources": "warn",

        // Best practices (warnings)
        "valid-source-maps": "warn",
        "no-document-write": "warn",
        "uses-responsive-images": "warn",
      },
    },
    upload: {
      target: "temporary-public-storage",
      reportFilenamePattern: "lhci-%%PATHNAME%%-%%DATETIME%%.json"
    },
  },
};
