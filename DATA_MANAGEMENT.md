# Data Management Guide for JurisGPT

## 📊 Current Data Status

### Large Files Overview

Your repository contains several large dataset files that need special handling:

| File Type | Size | Location | Status |
|-----------|------|----------|--------|
| **Arrow Files** | ~200MB+ | `data/datasets/indian_legal/` | ⚠️ Excluded from git |
| **SQLite DB** | ~MB | `data/datasets/indian_law_json/IndiaLaw.db` | ⚠️ Excluded from git |
| **JSON Law Files** | ~12K lines | `data/datasets/indian_law_json/*.json` | ✅ Included (small) |
| **Sample JSON** | Small | `data/datasets/samples/*.json` | ✅ Included |

### What's Currently Excluded

The following are **NOT** pushed to GitHub (via `.gitignore`):
- `*.arrow` files (large dataset files)
- `*.db` files (SQLite databases)
- `data/raw/` (downloaded archives)
- `data/vectors/` (vector database)
- `data/processed/*.json` (processed chunks)

### What's Currently Included

The following **ARE** pushed to GitHub:
- ✅ JSON law files (CPC, IPC, CRPC, etc.) - Small files
- ✅ Sample datasets (case_summaries.json, etc.)
- ✅ Dataset metadata files
- ✅ Python scripts for data processing

---

## 🎯 Recommended Approaches

### Option 1: Keep Data Local (Current Setup) ✅ **RECOMMENDED**

**Pros:**
- No GitHub storage limits
- Fast development
- Data stays private
- No additional setup needed

**Cons:**
- Team members need to download data separately
- Requires manual setup

**Implementation:**
- Current `.gitignore` already excludes large files
- Add `DATA_SETUP.md` with download instructions
- Use `data/download_datasets.py` script

**Best for:** Development, private repos, teams with data access

---

### Option 2: Git LFS (Large File Storage)

**Pros:**
- Version control for large files
- Automatic download on clone
- GitHub integration

**Cons:**
- GitHub LFS has storage limits (1GB free)
- Requires LFS setup
- Slower clone times

**Setup:**
```bash
# Install Git LFS
brew install git-lfs  # macOS
# or
apt-get install git-lfs  # Linux

# Initialize in your repo
git lfs install

# Track large files
git lfs track "*.arrow"
git lfs track "*.db"
git lfs track "data/vectors/**"

# Add .gitattributes
git add .gitattributes
git commit -m "Add Git LFS tracking"
git push origin main
```

**Best for:** Small-medium datasets, version control needed

---

### Option 3: External Storage (Cloud Storage)

**Pros:**
- Unlimited storage
- Fast access
- Can be shared separately
- No GitHub limits

**Cons:**
- Requires cloud account
- Separate download step
- Additional cost (if paid)

**Options:**
1. **AWS S3** - Reliable, scalable
2. **Google Cloud Storage** - Good integration
3. **Azure Blob Storage** - Enterprise-friendly
4. **Dropbox/Google Drive** - Simple sharing

**Implementation:**
- Upload large files to cloud storage
- Add download script in repo
- Document download URLs

**Best for:** Large datasets, production deployments

---

### Option 4: Dataset Registry (Hugging Face, Zenodo)

**Pros:**
- Designed for datasets
- Versioning built-in
- Public/private options
- Free for public datasets

**Cons:**
- Public datasets are public
- Requires account setup

**Options:**
- **Hugging Face Datasets** - Great for ML datasets
- **Zenodo** - Academic/research datasets
- **Kaggle Datasets** - Data science community

**Best for:** Public datasets, research projects

---

## 🚀 Recommended Solution for JurisGPT

### Current Setup (Keep Data Local) ✅

**Why this works best:**
1. Your datasets are already downloaded
2. JSON law files are small and included
3. Large files are properly excluded
4. Team can download using your script

### What to Do:

1. **Keep current `.gitignore`** ✅ Already done
2. **Add data setup instructions** (see below)
3. **Document download process**
4. **Optional: Add data checksum verification**

---

## 📝 Data Setup Instructions

### For New Team Members / Fresh Clone

1. **Clone Repository**
   ```bash
   git clone https://github.com/Bruhadev45/Juris-GPT.git
   cd Juris-GPT
   ```

2. **Download Datasets**
   ```bash
   cd data
   python3 download_datasets.py
   ```

3. **Verify Data**
   ```bash
   # Check if files exist
   ls -lh datasets/indian_law_json/Indian-Law-Penal-Code-Json-main/*.json
   ```

4. **Setup Backend**
   ```bash
   cd ../backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

---

## 🔒 Security Considerations

### What Should NEVER Be Pushed:

- ❌ `.env` files (API keys, secrets)
- ❌ Database files with real user data
- ❌ Private/confidential legal documents
- ❌ API keys or credentials

### What's Safe to Push:

- ✅ Public legal statutes (already public)
- ✅ Sample/test data
- ✅ Code and configuration
- ✅ Documentation

---

## 📋 Data File Checklist

### ✅ Safe to Push (Currently Included):
- [x] JSON law files (public statutes)
- [x] Sample datasets
- [x] Dataset metadata
- [x] Processing scripts

### ⚠️ Excluded (Large/Private):
- [ ] Arrow files (~200MB+)
- [ ] SQLite databases
- [ ] Vector embeddings
- [ ] Raw downloaded archives
- [ ] Processed chunks

---

## 🛠️ Quick Commands

### Check What's Tracked:
```bash
git ls-files data/
```

### Check Large Files:
```bash
find data -type f -size +10M -exec ls -lh {} \;
```

### Verify .gitignore:
```bash
git check-ignore -v data/datasets/indian_legal/train/data-00000-of-00001.arrow
```

### Add More Exclusions (if needed):
```bash
# Add to .gitignore
echo "data/large_files/" >> .gitignore
```

---

## 📚 Additional Resources

- [Git LFS Documentation](https://git-lfs.github.com/)
- [GitHub Large File Limits](https://docs.github.com/en/repositories/working-with-files/managing-large-files)
- [Hugging Face Datasets](https://huggingface.co/datasets)

---

## ✅ Current Status

**Your repository is SAFE:**
- ✅ Large files are excluded
- ✅ Sensitive files (.env) are excluded
- ✅ Only necessary files are tracked
- ✅ JSON law files are included (small, public data)

**No action needed** - your current setup is optimal for development!

---

**Last Updated:** February 4, 2026
