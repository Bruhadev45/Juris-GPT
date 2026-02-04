#!/usr/bin/env python3
"""
Download JurisGPT datasets from cloud storage
"""
import os
import json
from pathlib import Path
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

def download_from_aws_s3(config: dict):
    """Download from AWS S3"""
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
    
    print(f"\n📥 Downloading from S3 bucket: {bucket_name}")
    
    files_to_download = [
        ("indian_legal/train/data-00000-of-00001.arrow", "indian_legal/train/"),
        ("indian_legal/test/data-00000-of-00001.arrow", "indian_legal/test/"),
        ("indian_legal/train/dataset_info.json", "indian_legal/train/"),
        ("indian_legal/test/dataset_info.json", "indian_legal/test/"),
        ("indian_legal/dataset_dict.json", "indian_legal/"),
        ("indian_law_json/Indian-Law-Penal-Code-Json-main/IndiaLaw.db", "indian_law_json/Indian-Law-Penal-Code-Json-main/"),
        ("vectors/chroma_db/chroma.sqlite3", "../vectors/chroma_db/"),
    ]
    
    downloaded = 0
    failed = 0
    
    for file_name, local_dir in files_to_download:
        local_dir_path = DATASETS_DIR / local_dir if not local_dir.startswith("../") else BASE_DIR.parent / "data" / local_dir.replace("../", "")
        local_dir_path.mkdir(parents=True, exist_ok=True)
        local_path = local_dir_path / Path(file_name).name
        
        remote_key = f"{base_path}/{file_name}"
        
        try:
            print(f"📥 Downloading {Path(file_name).name}...", end=" ")
            
            s3_client.download_file(bucket_name, remote_key, str(local_path))
            file_size = local_path.stat().st_size / (1024 * 1024)
            print(f"✅ ({file_size:.1f} MB)")
            downloaded += 1
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                print("⚠️  Not found in cloud")
            else:
                print(f"❌ Error: {e}")
            failed += 1
    
    print(f"\n✅ Download complete! {downloaded} files downloaded, {failed} failed/skipped")

def download_from_google_cloud(config: dict):
    """Download from Google Cloud Storage"""
    try:
        from google.cloud import storage
        from google.oauth2 import service_account
    except ImportError:
        print("❌ Error: google-cloud-storage not installed!")
        print("Install: pip install google-cloud-storage")
        sys.exit(1)
    
    bucket_name = config['bucket_name']
    base_path = config.get('base_path', 'jurisgpt-datasets')
    
    if config.get('credentials_path'):
        credentials = service_account.Credentials.from_service_account_file(
            config['credentials_path']
        )
        client = storage.Client(credentials=credentials, project=config['project_id'])
    else:
        client = storage.Client(project=config['project_id'])
    
    bucket = client.bucket(bucket_name)
    
    print(f"\n📥 Downloading from GCS bucket: {bucket_name}")
    
    files_to_download = [
        ("indian_legal/train/data-00000-of-00001.arrow", "indian_legal/train/"),
        ("indian_legal/test/data-00000-of-00001.arrow", "indian_legal/test/"),
        ("indian_legal/train/dataset_info.json", "indian_legal/train/"),
        ("indian_legal/test/dataset_info.json", "indian_legal/test/"),
        ("indian_legal/dataset_dict.json", "indian_legal/"),
        ("indian_law_json/Indian-Law-Penal-Code-Json-main/IndiaLaw.db", "indian_law_json/Indian-Law-Penal-Code-Json-main/"),
        ("vectors/chroma_db/chroma.sqlite3", "../vectors/chroma_db/"),
    ]
    
    downloaded = 0
    failed = 0
    
    for file_name, local_dir in files_to_download:
        local_dir_path = DATASETS_DIR / local_dir if not local_dir.startswith("../") else BASE_DIR.parent / "data" / local_dir.replace("../", "")
        local_dir_path.mkdir(parents=True, exist_ok=True)
        local_path = local_dir_path / Path(file_name).name
        
        remote_key = f"{base_path}/{file_name}"
        blob = bucket.blob(remote_key)
        
        try:
            if not blob.exists():
                print(f"⚠️  {Path(file_name).name} not found in cloud")
                failed += 1
                continue
            
            print(f"📥 Downloading {Path(file_name).name}...", end=" ")
            blob.download_to_filename(str(local_path))
            file_size = local_path.stat().st_size / (1024 * 1024)
            print(f"✅ ({file_size:.1f} MB)")
            downloaded += 1
        except Exception as e:
            print(f"❌ Error: {e}")
            failed += 1
    
    print(f"\n✅ Download complete! {downloaded} files downloaded, {failed} failed/skipped")

def download_from_azure(config: dict):
    """Download from Azure Blob Storage"""
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
    
    print(f"\n📥 Downloading from Azure container: {container_name}")
    
    files_to_download = [
        ("indian_legal/train/data-00000-of-00001.arrow", "indian_legal/train/"),
        ("indian_legal/test/data-00000-of-00001.arrow", "indian_legal/test/"),
        ("indian_legal/train/dataset_info.json", "indian_legal/train/"),
        ("indian_legal/test/dataset_info.json", "indian_legal/test/"),
        ("indian_legal/dataset_dict.json", "indian_legal/"),
        ("indian_law_json/Indian-Law-Penal-Code-Json-main/IndiaLaw.db", "indian_law_json/Indian-Law-Penal-Code-Json-main/"),
        ("vectors/chroma_db/chroma.sqlite3", "../vectors/chroma_db/"),
    ]
    
    downloaded = 0
    failed = 0
    
    for file_name, local_dir in files_to_download:
        local_dir_path = DATASETS_DIR / local_dir if not local_dir.startswith("../") else BASE_DIR.parent / "data" / local_dir.replace("../", "")
        local_dir_path.mkdir(parents=True, exist_ok=True)
        local_path = local_dir_path / Path(file_name).name
        
        blob_name = f"{base_path}/{file_name}"
        blob_client = container_client.get_blob_client(blob_name)
        
        try:
            if not blob_client.exists():
                print(f"⚠️  {Path(file_name).name} not found in cloud")
                failed += 1
                continue
            
            print(f"📥 Downloading {Path(file_name).name}...", end=" ")
            with open(local_path, "wb") as download_file:
                download_file.write(blob_client.download_blob().readall())
            file_size = local_path.stat().st_size / (1024 * 1024)
            print(f"✅ ({file_size:.1f} MB)")
            downloaded += 1
        except Exception as e:
            print(f"❌ Error: {e}")
            failed += 1
    
    print(f"\n✅ Download complete! {downloaded} files downloaded, {failed} failed/skipped")

def main():
    config = load_config()
    provider = config['provider']
    
    if provider == 'aws_s3':
        download_from_aws_s3(config)
    elif provider == 'google_cloud':
        download_from_google_cloud(config)
    elif provider == 'azure':
        download_from_azure(config)
    else:
        print(f"❌ Unknown provider: {provider}")
        sys.exit(1)

if __name__ == "__main__":
    main()
