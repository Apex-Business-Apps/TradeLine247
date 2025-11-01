# 🚀 DevOps Skill Installation Guide

## Quick Install

### Option 1: Copy Directory
```bash
# Copy to your project
cp -r .claude-devops-skill /path/to/your/project/.claude

# Make scripts executable
chmod +x /path/to/your/project/.claude/scripts/*.sh
```

### Option 2: Manual Setup

1. **Create directory structure:**
```bash
cd /path/to/your/project
mkdir -p .claude/skills .claude/scripts .claude/configs
```

2. **Copy files:**
```bash
cp .claude-devops-skill/devops.md .claude/skills/
cp .claude-devops-skill/scripts/* .claude/scripts/
cp .claude-devops-skill/configs/* .claude/configs/
```

3. **Make scripts executable:**
```bash
chmod +x .claude/scripts/*.sh
```

## Verification

Test the installation:

```bash
# Check directory structure
ls -la .claude/

# Test a script
./.claude/scripts/quality-check.sh
```

## Activation

The skill will be automatically available in Claude Code. Use it by:

1. **Explicit activation:**
   ```
   /skill devops
   ```

2. **Implicit activation:**
   ```
   "Analyze this code with maximum technical mastery"
   ```

3. **Protocol-specific:**
   ```
   "Fix this bug using Protocol A"
   ```

## Integration with Existing Workflow

### Add to package.json:
```json
{
  "scripts": {
    "claude:audit": "./.claude/scripts/audit.sh",
    "claude:check": "./.claude/scripts/quality-check.sh",
    "claude:deploy": "./.claude/scripts/deploy-check.sh",
    "claude:perf": "./.claude/scripts/perf-profile.sh",
    "claude:security": "./.claude/scripts/security-scan.sh"
  }
}
```

### Add to Git Hooks:

Create `.git/hooks/pre-commit`:
```bash
#!/bin/bash
./.claude/scripts/quality-check.sh
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

### Add to CI/CD:

GitHub Actions (`.github/workflows/claude-quality.yml`):
```yaml
name: Claude DevOps Quality Gate
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: ./.claude/scripts/audit.sh
```

## Troubleshooting

### Scripts won't execute
```bash
# Make executable
chmod +x .claude/scripts/*.sh

# Check shebang
head -1 .claude/scripts/audit.sh  # Should show #!/bin/bash
```

### Skill not activating
1. Verify file location: `.claude/skills/devops.md`
2. Restart Claude Code
3. Try explicit activation: `/skill devops`

### Permission errors
```bash
# Fix permissions
chmod -R u+rwX .claude/
```

## Next Steps

1. Run your first audit: `npm run claude:audit`
2. Review the README.md for usage examples
3. Customize scripts for your specific needs
4. Share with your team!

## Support

For issues or questions:
- Check the README.md for detailed documentation
- Review the skill prompt in `.claude/skills/devops.md`
- Consult Claude Code documentation

---

**Happy coding with maximum technical mastery!** 🚀
