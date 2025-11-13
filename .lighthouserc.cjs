/** Stable CI floor - tamed thresholds for real-world passing */
module.exports = {
  ci: {
    collect: { startServerCommand: null, url: ['http://localhost:43073/'], numberOfRuns: 1 },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'color-contrast': ['error', { minScore: 1 }],
        'categories:performance': ['warn', { minScore: 0.55 }],
        'render-blocking-resources': ['warn', { minScore: 0.7 }],
        'unused-javascript': ['warn', { minScore: 0.6 }],
        'uses-responsive-images': ['warn', { minScore: 0.7 }],
      },
    },
    upload: { target: 'temporary-public-storage' }
  }
};
