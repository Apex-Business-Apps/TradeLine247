module.exports = {
  ci: {
    collect: {
      startServerCommand: null,
      url: ['http://localhost:43073/'],
      numberOfRuns: 1,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'color-contrast': 'off',
        'categories:performance': ['warn', { minScore: 0.35 }],
        'render-blocking-resources': ['warn', { minScore: 0 }],
        'unused-css-rules': ['warn', { minScore: 0.5 }],
        'unused-javascript': ['warn', { minScore: 0 }],
        'uses-responsive-images': ['warn', { minScore: 0 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
