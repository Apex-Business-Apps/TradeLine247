/* CJS config to work with "type": "module" in package.json */
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
    assert: { preset: "lighthouse:recommended" },
    upload: { target: "temporary-public-storage" },
  },
};
