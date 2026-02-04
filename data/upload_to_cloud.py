#!/usr/bin/env python3
"""
Upload JurisGPT datasets to cloud storage
"""
import os
import json
from pathlib import Path
from typing import Optional
import sys

BASE_DIR = Path(__file__).parent
DATASETS_DIR = BASE_DIR / "datasets"
CONFIG_FILE = BASE_DIR / "cloud_config.json"

def load_config():
    """Load cloud configuration"""
    if not CONFIG_FILE.exists():
        print("❌ Error: cloud_config.json not found!")
        print("Run: python3 cloud_storage_setup.py")
        sys.exit(1)
    
    with open(CONFIG_FILE, 'r') as f:
        return json.load(f)

def upload_to_aws_s3(config: dict):
    """Upload to AWS S3"""
    try:
        import boto3
        from botocore.exceptions import ClientError
    except ImportError:
        print("❌ Error: boto3 not installed!")
        print("Install: pip install boto3")
        sys.exit(1)
    
    s3_client = boto3.client(
        's3',
        aws_access_key_id=config['access_key_id'],
        aws_secret_access_key=config['secret_access_key'],
        region_name=config['region']
    )
    
    bucket_name = config['bucket_name']
    base_path = config.get('base_path', 'jurisgpt-datasets')
    
    print(f"\n📤 Uploading to S3 bucket: {bucket_name}")
    
    # Files to upload
    files_to_upload = [
        # Large dataset files
        ("indian_legal/train/data-00000-of-00001.arrow", "indian_legal/train/"),
        ("indian_legal/test/data-00000-of-00001.arrow", "indian_legal/test/"),
        ("indian_legal/train/dataset_info.json", "indian_legal/train/"),
        ("indian_legal/test/dataset_info.json", "indian_legal/test/"),
        ("indian_legal/dataset_dict.json", "indian_legal/"),
        
        # Database files
        ("indian_law_json/Indian-Law-Penal-Code-Json-main/IndiaLaw.db", "indian_law_json/"),
        
        # Vector database
        ("../vectors/chroma_db/chroma.sqlite3", "vectors/"),
    ]
    
    uploaded = 0
    failed = 0
    
    for file_path, remote_dir in files_to_upload:
        local_path = DATASETS_DIR / file_path
        if not local_path.exists():
            # Try alternative path for vectors
            if "vectors" in file_path:
                local_path = BASE_DIR.parent / "data" / "vectors" / "chroma_db" / "chroma.sqlite3"
            
            if not local_path.exists():
                print(f"⚠️  Skipping {file_path} (not found)")
                continue
        
        remote_key = f"{base_path}/{remote_dir}{local_path.name}"
        
        try:
            file_size = local_path.stat().st_size / (1024 * 1024)  # MB
            print(f"📤 Uploading {local_path.name} ({file_size:.1f} MB)...", end=" ")
            
            s3_client.upload_file(
                str(local_path),
                bucket_name,
                remote_key,
                ExtraArgs={'ServerSideEncryption': 'AES256'}
            )
            print("✅")
            uploaded += 1
        except ClientError as e:
            print(f"❌ Error: {e}")
            failed += 1
    
    print(f"\n✅ Upload complete! {uploaded} files uploaded, {failed} failed")
    print(f"📦 Files available at: s3://{bucket_name}/{base_path}/")

def upload_to_google_cloud(config: dict):
    """Upload to Google Cloud Storage"""
    try:
        from google.cloud import storage
        from google.oauth2 import service_account
    except ImportError:
        print("❌ Error: google-cloud-storage not installed!")
        print("Install: pip install google-cloud-storage")
        sys.exit(1)
    
    bucket_name = config['bucket_name']
    base_path = config.get('base_path', 'jurisgpt-datasets')
    
    # Initialize client
    if config.get('credentials_path'):
        credentials = service_account.Credentials.from_service_account_file(
            config['credentials_path']
        )
        client = storage.Client(credentials=credentials, project=config['project_id'])
    else:
        client = storage.Client(project=config['project_id'])
    
    bucket = client.bucket(bucket_name)
    
    print(f"\n📤 Uploading to GCS bucket: {bucket_name}")
    
    # Same file list as AWS
    files_to_upload = [
        ("indian_legal/train/data-00000-of-00001.arrow", "indian_legal/train/"),
        ("indian_legal/test/data-00000-of-00001.arrow", "indian_legal/test/"),
        ("indian_legal/train/dataset_info.json", "indian_legal/train/"),
        ("indian_legal/test/dataset_info.json", "indian_legal/test/"),
        ("indian_legal/dataset_dict.json", "indian_legal/"),
        ("indian_law_json/Indian-Law-Penal-Code-Json-main/IndiaLaw.db", "indian_law_json/"),
        ("../vectors/chroma_db/chroma.sqlite3", "vectors/"),
    ]
    
    uploaded = 0
    failed = 0
    
    for file_path, remote_dir in files_to_upload:
        local_path = DATASETS_DIR / file_path
        if not local_path.exists():
            if "vectors" in file_path:
                local_path = BASE_DIR.parent / "data" / "vectors" / "chroma_db" / "chroma.sqlite3"
            if not local_path.exists():
                print(f"⚠️  Skipping {file_path} (not found)")
                continue
        
        remote_key = f"{base_path}/{remote_dir}{local_path.name}"
        blob = bucket.blob(remote_key)
        
        try:
            file_size = local_path.stat().st_size / (1024 * 1024)
            print(f"📤 Uploading {local_path.name} ({file_size:.1f} MB)...", end=" ")
            
            blob.upload_from_filename(str(local_path))
            print("✅")
            uploaded += 1
        except Exception as e:
            print(f"❌ Error: {e}")
            failed += 1
    
    print(f"\n✅ Upload complete! {uploaded} files uploaded, {failed} failed")
    print(f"📦 Files available at: gs://{bucket_name}/{base_path}/")

def upload_to_azure(config: dict):
    """Upload to Azure Blob Storage"""
    try:
        from azure.storage.blob import BlobServiceClient
    except ImportError:
        print("❌ Error: azure-storage-blob not installed!")
        print("Install: pip install azure-storage-blob")
        sys.exit(1)
    
    account_name = config['account_name']
    account_key = config['account_key']
    container_name = config['container_name']
    base_path = config.get('base_path', 'jurisgpt-datasets')
    
    blob_service_client = BlobServiceClient(
        account_url=f"https://{account_name}.blob.core.windows.net",
        credential=account_key
    )
    container_client = blob_service_client.get_container_client(container_name)
    
    print(f"\n📤 Uploading to Azure container: {container_name}")
    
    files_to_upload = [
        ("indian_legal/train/data-00000-of-00001.arrow", "indian_legal/train/"),
        ("indian_legal/test/data-00000-of-00001.arrow", "indian_legal/test/"),
        ("indian_legal/train/dataset_info.json", "indian_legal/train/"),
        ("indian_legal/test/dataset_info.json", "indian_legal/test/"),
        ("indian_legal/dataset_dict.json", "indian_legal/"),
        ("indian_law_json/Indian-Law-Penal-Code-Json-main/IndiaLaw.db", "indian_law_json/"),
        ("../vectors/chroma_db/chroma.sqlite3", "vectors/"),
    ]
    
    uploaded = 0
    failed = 0
    
    for file_path, remote_dir in files_to_upload:
        local_path = DATASETS_DIR / file_path
        if not local_path.exists():
            if "vectors" in file_path:
                local_path = BASE_DIR.parent / "data" / "vectors" / "chroma_db" / "chroma.sqlite3"
            if not local_path.exists():
                print(f"⚠️  Skipping {file_path} (not found)")
                continue
        
        blob_name = f"{base_path}/{remote_dir}{local_path.name}"
        blob_client = container_client.get_blob_client(blob_name)
        
        try:
            file_size = local_path.stat().st_size / (1024 * 1024)
            print(f"📤 Uploading {local_path.name} ({file_size:.1f} MB)...", end=" ")
            
            with open(local_path, "rb") as data:
                blob_client.upload_blob(data, overwrite=True)
            print("✅")
            uploaded += 1
        except Exception as e:
            print(f"❌ Error: {e}")
            failed += 1
    
    print(f"\n✅ Upload complete! {uploaded} files uploaded, {failed} failed")
    print(f"📦 Files available at: https://{account_name}.blob.core.windows.net/{container_name}/{base_path}/")

def main():
    config = load_config()
    provider = config['provider']
    
    if provider == 'aws_s3':
        upload_to_aws_s3(config)
    elif provider == 'google_cloud':
        upload_to_google_cloud(config)
    elif provider == 'azure':
        upload_to_azure(config)
    else:
        print(f"❌ Unknown provider: {provider}")
        sys.exit(1)

if __name__ == "__main__":
    main()
