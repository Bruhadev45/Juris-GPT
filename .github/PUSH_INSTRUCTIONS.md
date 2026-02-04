# GitHub Push Instructions

## Quick Push Commands

### Initial Setup (Already Done)
```bash
git init
git remote add origin https://github.com/Bruhadev45/Juris-GPT.git
git branch -M main
```

### For Future Updates

1. **Check Status**
   ```bash
   git status
   ```

2. **Add Changes**
   ```bash
   git add .
   # Or add specific files:
   git add path/to/file
   ```

3. **Commit Changes**
   ```bash
   git commit -m "Your commit message describing the changes"
   ```

4. **Push to GitHub**
   ```bash
   git push origin main
   ```

### Common Workflow

```bash
# 1. Make your changes
# 2. Stage changes
git add .

# 3. Commit
git commit -m "Description of changes"

# 4. Push
git push origin main
```

### Pull Latest Changes

```bash
git pull origin main
```

### Check Remote Repository

```bash
git remote -v
```

## Repository URL

**GitHub:** https://github.com/Bruhadev45/Juris-GPT.git

## Excluded Files

The following are excluded from git (see `.gitignore`):
- `node_modules/`
- `.env` files
- `venv/` directories
- Large dataset files (`.arrow`, `.db`)
- Build artifacts
- IDE files

## Notes

- Always commit meaningful messages
- Don't commit sensitive data (API keys, passwords)
- Large files (>100MB) should use Git LFS
- Keep commits focused and atomic
