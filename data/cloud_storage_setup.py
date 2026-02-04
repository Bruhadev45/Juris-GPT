#!/usr/bin/env python3
"""
Cloud Storage Setup for JurisGPT Datasets
Supports AWS S3, Google Cloud Storage, and Azure Blob Storage
"""
import os
import sys
from pathlib import Path
from typing import Optional
import json

BASE_DIR = Path(__file__).parent
DATASETS_DIR = BASE_DIR / "datasets"
CONFIG_FILE = BASE_DIR / "cloud_config.json"

def setup_aws_s3():
    """Setup AWS S3 configuration"""
    print("\n" + "="*60)
    print("☁️  AWS S3 Setup")
    print("="*60)
    
    bucket_name = input("Enter S3 bucket name: ").strip()
    region = input("Enter AWS region (e.g., us-east-1): ").strip() or "us-east-1"
    access_key = input("Enter AWS Access Key ID: ").strip()
    secret_key = input("Enter AWS Secret Access Key: ").strip()
    
    config = {
        "provider": "aws_s3",
        "bucket_name": bucket_name,
        "region": region,
        "access_key_id": access_key,
        "secret_access_key": secret_key,
        "base_path": "jurisgpt-datasets"
    }
    
    return config

def setup_google_cloud():
    """Setup Google Cloud Storage configuration"""
    print("\n" + "="*60)
    print("☁️  Google Cloud Storage Setup")
    print("="*60)
    
    bucket_name = input("Enter GCS bucket name: ").strip()
    project_id = input("Enter GCP Project ID: ").strip()
    credentials_path = input("Enter path to service account JSON (or press Enter to use default): ").strip()
    
    config = {
        "provider": "google_cloud",
        "bucket_name": bucket_name,
        "project_id": project_id,
        "credentials_path": credentials_path or None,
        "base_path": "jurisgpt-datasets"
    }
    
    return config

def setup_azure():
    """Setup Azure Blob Storage configuration"""
    print("\n" + "="*60)
    print("☁️  Azure Blob Storage Setup")
    print("="*60)
    
    account_name = input("Enter Azure Storage Account Name: ").strip()
    account_key = input("Enter Azure Storage Account Key: ").strip()
    container_name = input("Enter Container Name: ").strip()
    
    config = {
        "provider": "azure",
        "account_name": account_name,
        "account_key": account_key,
        "container_name": container_name,
        "base_path": "jurisgpt-datasets"
    }
    
    return config

def save_config(config: dict):
    """Save cloud configuration"""
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=2)
    print(f"\n✅ Configuration saved to {CONFIG_FILE}")
    print("⚠️  Keep this file secure! Add to .gitignore")

def main():
    print("🚀 JurisGPT Cloud Storage Setup")
    print("\nSelect cloud provider:")
    print("1. AWS S3")
    print("2. Google Cloud Storage")
    print("3. Azure Blob Storage")
    print("4. Cancel")
    
    choice = input("\nEnter choice (1-4): ").strip()
    
    if choice == "1":
        config = setup_aws_s3()
    elif choice == "2":
        config = setup_google_cloud()
    elif choice == "3":
        config = setup_azure()
    else:
        print("Cancelled.")
        return
    
    save_config(config)
    print("\n✅ Setup complete!")
    print("\nNext steps:")
    print("1. Install required packages: pip install boto3 (for AWS) or google-cloud-storage (for GCS)")
    print("2. Run upload script: python3 upload_to_cloud.py")
    print("3. Update .gitignore to exclude cloud_config.json")

if __name__ == "__main__":
    main()
