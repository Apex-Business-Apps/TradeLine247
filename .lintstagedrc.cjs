module.exports = {
  '*.{ts,tsx,js,jsx}': [
    'eslint --fix --max-warnings=0',
  ],
  '*.{json,md,yml,yaml}': [
    'prettier --write',
  ],
};
