# Quick Start: Cloud Storage Setup

## 🚀 5-Minute Setup

### Step 1: Choose Provider & Create Account

**AWS S3 (Recommended):**
1. Sign up: https://aws.amazon.com/free/
2. Go to S3 Console → Create bucket
3. Name: `jurisgpt-datasets` (or your choice)
4. Region: Choose closest (e.g., `us-east-1`)
5. Create IAM user with S3 access
6. Get Access Key ID and Secret Access Key

**Google Cloud Storage:**
1. Sign up: https://cloud.google.com/free
2. Create storage bucket
3. Create service account
4. Download JSON credentials

**Azure Blob Storage:**
1. Sign up: https://azure.microsoft.com/free/
2. Create storage account
3. Create container
4. Get account name and key

---

### Step 2: Install Required Package

**For AWS S3:**
```bash
pip install boto3
```

**For Google Cloud:**
```bash
pip install google-cloud-storage
```

**For Azure:**
```bash
pip install azure-storage-blob
```

---

### Step 3: Configure

```bash
cd data
python3 cloud_storage_setup.py
```

Enter your credentials when prompted.

---

### Step 4: Upload Your Data

```bash
python3 upload_to_cloud.py
```

This uploads:
- ✅ Large arrow files (~200MB)
- ✅ Database files
- ✅ Vector database

---

### Step 5: Download (for team members)

```bash
python3 download_from_cloud.py
```

---

## ✅ Done!

Your large datasets are now safely stored in the cloud!

**Next:** Update your team documentation with cloud setup instructions.

---

## 💡 Tips

- **Free Tier:** AWS/GCP offer 5GB free storage
- **Cost:** ~$5-10/month for 250GB
- **Security:** Never commit `cloud_config.json` (already in .gitignore)
- **Backup:** Cloud storage provides automatic backup

---

## 📚 Full Guide

See `CLOUD_STORAGE_GUIDE.md` for detailed instructions.
