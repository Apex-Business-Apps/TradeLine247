/* CJS config to work with "type": "module" projects */
module.exports = {
  ci: {
    collect: {
      staticDistDir: 'dist',
      numberOfRuns: 1,
      settings: {
        emulatedFormFactor: 'mobile',
        locale: 'en-US',
        throttlingMethod: 'devtools',
      },
    },
    assert: { preset: 'lighthouse:recommended' },
    upload: { target: 'temporary-public-storage' },
  },
};
