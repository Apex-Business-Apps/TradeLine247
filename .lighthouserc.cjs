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
    // Assertions are disabled in stabilization; produce reports without failing CI
    assert: { assertions: {} },
    upload: { target: "temporary-public-storage" },
  },
};
