# Cloud Storage Setup Guide for JurisGPT

## 🎯 Why Cloud Storage?

Cloud storage is perfect for:
- ✅ Large dataset files (>100MB)
- ✅ Team collaboration
- ✅ Backup and versioning
- ✅ Easy sharing
- ✅ No GitHub storage limits

## ☁️ Supported Providers

1. **AWS S3** - Most popular, reliable
2. **Google Cloud Storage** - Great integration
3. **Azure Blob Storage** - Enterprise-friendly

---

## 🚀 Quick Start

### Step 1: Choose Your Provider

#### Option A: AWS S3 (Recommended)

**Pros:**
- Most widely used
- Excellent documentation
- Free tier: 5GB storage, 20K requests/month

**Setup:**
1. Create AWS account: https://aws.amazon.com/
2. Create S3 bucket
3. Create IAM user with S3 access
4. Get Access Key ID and Secret Access Key

**Cost:** ~$0.023 per GB/month (first 50TB)

#### Option B: Google Cloud Storage

**Pros:**
- Good integration with Google services
- Free tier: 5GB storage

**Setup:**
1. Create GCP account: https://cloud.google.com/
2. Create storage bucket
3. Create service account
4. Download JSON credentials

**Cost:** ~$0.020 per GB/month

#### Option C: Azure Blob Storage

**Pros:**
- Enterprise features
- Good for Microsoft ecosystem

**Setup:**
1. Create Azure account: https://azure.microsoft.com/
2. Create storage account
3. Create container
4. Get account name and key

**Cost:** ~$0.018 per GB/month

---

## 📋 Setup Instructions

### Step 1: Install Required Packages

**For AWS S3:**
```bash
pip install boto3
```

**For Google Cloud Storage:**
```bash
pip install google-cloud-storage
```

**For Azure Blob Storage:**
```bash
pip install azure-storage-blob
```

### Step 2: Configure Cloud Storage

```bash
cd data
python3 cloud_storage_setup.py
```

Follow the prompts to enter your cloud provider credentials.

### Step 3: Upload Datasets

```bash
python3 upload_to_cloud.py
```

This will upload:
- ✅ Arrow dataset files (~200MB)
- ✅ SQLite database files
- ✅ Vector database files
- ✅ Dataset metadata

### Step 4: Download Datasets (for team members)

```bash
python3 download_from_cloud.py
```

---

## 📁 What Gets Uploaded

### Large Files (Uploaded to Cloud):
- `indian_legal/train/data-00000-of-00001.arrow` (~200MB)
- `indian_legal/test/data-00000-of-00001.arrow` (~3MB)
- `indian_law_json/.../IndiaLaw.db` (SQLite database)
- `vectors/chroma_db/chroma.sqlite3` (Vector database)
- Dataset metadata files

### Small Files (Stay in Git):
- JSON law files (CPC, IPC, etc.) - Already in repository
- Sample datasets - Already in repository
- Python scripts - Already in repository

---

## 🔒 Security Best Practices

### 1. Protect Credentials

**Never commit:**
- ❌ `cloud_config.json` (contains credentials)
- ❌ AWS Access Keys
- ❌ GCP Service Account JSON
- ❌ Azure Account Keys

**Already excluded in `.gitignore`** ✅

### 2. Use IAM Roles (AWS)

For production, use IAM roles instead of access keys:
- More secure
- No key management
- Automatic rotation

### 3. Set Bucket Policies

Restrict access:
- Only allow specific IPs (optional)
- Use bucket policies
- Enable versioning for backup

### 4. Environment Variables (Alternative)

Instead of `cloud_config.json`, use environment variables:

```bash
# AWS
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_REGION=us-east-1
export S3_BUCKET_NAME=jurisgpt-datasets

# Then modify scripts to read from env vars
```

---

## 💰 Cost Estimation

### AWS S3 Example:
- **Storage:** 250GB × $0.023 = **$5.75/month**
- **Requests:** 10K GET × $0.0004 = **$0.004/month**
- **Data Transfer:** First 100GB free, then $0.09/GB

**Total:** ~$6-10/month for typical usage

### Google Cloud Storage Example:
- **Storage:** 250GB × $0.020 = **$5/month**
- **Operations:** Included in free tier
- **Data Transfer:** First 100GB free

**Total:** ~$5-8/month

### Azure Blob Storage Example:
- **Storage:** 250GB × $0.018 = **$4.50/month**
- **Transactions:** Included
- **Data Transfer:** First 100GB free

**Total:** ~$4.50-7/month

---

## 🔄 Workflow

### For Developers:

1. **Clone Repository**
   ```bash
   git clone https://github.com/Bruhadev45/Juris-GPT.git
   cd Juris-GPT
   ```

2. **Setup Cloud Config**
   ```bash
   cd data
   python3 cloud_storage_setup.py
   ```

3. **Download Datasets**
   ```bash
   python3 download_from_cloud.py
   ```

4. **Start Development**
   ```bash
   # Backend
   cd ../backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   
   # Frontend
   cd ../frontend
   npm install
   ```

### For Updates:

1. **Upload New Data**
   ```bash
   cd data
   python3 upload_to_cloud.py
   ```

2. **Team Downloads**
   ```bash
   python3 download_from_cloud.py
   ```

---

## 🛠️ Troubleshooting

### Error: "Access Denied"
- Check IAM permissions
- Verify bucket policies
- Check credentials

### Error: "Bucket Not Found"
- Verify bucket name
- Check region
- Ensure bucket exists

### Error: "Module Not Found"
```bash
# Install required package
pip install boto3  # for AWS
pip install google-cloud-storage  # for GCS
pip install azure-storage-blob  # for Azure
```

### Slow Upload/Download
- Check internet connection
- Use multipart upload for large files
- Consider using AWS CLI / gsutil for faster transfers

---

## 📊 File Size Reference

| File | Size | Location |
|------|------|----------|
| Train Arrow | ~200MB | `indian_legal/train/` |
| Test Arrow | ~3MB | `indian_legal/test/` |
| SQLite DB | ~MB | `indian_law_json/` |
| Vector DB | ~19MB | `vectors/chroma_db/` |

**Total:** ~220MB+ to upload

---

## ✅ Checklist

- [ ] Choose cloud provider
- [ ] Create account and bucket
- [ ] Install required Python packages
- [ ] Run `cloud_storage_setup.py`
- [ ] Run `upload_to_cloud.py`
- [ ] Verify files in cloud console
- [ ] Test download with `download_from_cloud.py`
- [ ] Update team documentation
- [ ] Add cloud config to `.gitignore` ✅ (already done)

---

## 🔗 Useful Links

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Google Cloud Storage Docs](https://cloud.google.com/storage/docs)
- [Azure Blob Storage Docs](https://docs.microsoft.com/azure/storage/blobs/)
- [AWS Free Tier](https://aws.amazon.com/free/)
- [GCP Free Tier](https://cloud.google.com/free)

---

## 📝 Example: AWS S3 Setup

### 1. Create S3 Bucket
```bash
aws s3 mb s3://jurisgpt-datasets --region us-east-1
```

### 2. Create IAM User
- Go to IAM Console
- Create user: `jurisgpt-datasets-user`
- Attach policy: `AmazonS3FullAccess` (or custom policy)
- Create access key
- Save Access Key ID and Secret Access Key

### 3. Configure Script
```bash
cd data
python3 cloud_storage_setup.py
# Enter: jurisgpt-datasets
# Enter: us-east-1
# Enter: YOUR_ACCESS_KEY_ID
# Enter: YOUR_SECRET_ACCESS_KEY
```

### 4. Upload
```bash
python3 upload_to_cloud.py
```

---

**Last Updated:** February 4, 2026
