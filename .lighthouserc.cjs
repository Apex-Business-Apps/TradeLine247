/* CJS config compatible with package.json { "type": "module" } */
module.exports = {
  ci: {
    collect: {
      url: [process.env.LHCI_URL || "https://tradeline247ai.com/"],
      numberOfRuns: 1,
      settings: {
        budgetsPath: ".lighthousebudgets.json",
        chromeFlags: "--no-sandbox",
      },
    },
    // Provide a minimal assertion so LHCI does not exit early while keeping it non-blocking
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
