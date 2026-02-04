#!/usr/bin/env python3
"""
JurisGPT Dataset Downloader
Downloads legal datasets from various sources for RAG pipeline
"""

import os
import sys
import json
import zipfile
import tarfile
import requests
from pathlib import Path
from tqdm import tqdm
import subprocess

# Base paths
BASE_DIR = Path(__file__).parent
RAW_DIR = BASE_DIR / "raw"
DATASETS_DIR = BASE_DIR / "datasets"

# Create directories
RAW_DIR.mkdir(exist_ok=True)
DATASETS_DIR.mkdir(exist_ok=True)


def download_file(url: str, dest_path: Path, desc: str = None) -> bool:
    """Download a file with progress bar"""
    try:
        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()
        total_size = int(response.headers.get('content-length', 0))

        with open(dest_path, 'wb') as f:
            with tqdm(total=total_size, unit='iB', unit_scale=True, desc=desc or dest_path.name) as pbar:
                for chunk in response.iter_content(chunk_size=8192):
                    size = f.write(chunk)
                    pbar.update(size)
        return True
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return False


def download_github_indian_law_json():
    """Download Indian Law Penal Code JSON from GitHub"""
    print("\n" + "="*60)
    print("📚 Downloading Indian Law JSON from GitHub...")
    print("="*60)

    repo_url = "https://github.com/civictech-India/Indian-Law-Penal-Code-Json"
    zip_url = f"{repo_url}/archive/refs/heads/master.zip"
    dest_path = RAW_DIR / "indian-law-json.zip"
    extract_path = DATASETS_DIR / "indian_law_json"

    if download_file(zip_url, dest_path, "Indian Law JSON"):
        extract_path.mkdir(exist_ok=True)
        with zipfile.ZipFile(dest_path, 'r') as zip_ref:
            zip_ref.extractall(extract_path)
        print(f"✅ Extracted to {extract_path}")
        return True
    return False


def download_zenodo_central_acts():
    """Download Central Acts dataset from Zenodo"""
    print("\n" + "="*60)
    print("📜 Downloading Central Acts from Zenodo...")
    print("="*60)

    # Zenodo record 5088102 - Annotated Central Acts
    zenodo_url = "https://zenodo.org/records/5088102/files/central_acts_json.zip?download=1"
    dest_path = RAW_DIR / "central_acts.zip"
    extract_path = DATASETS_DIR / "central_acts"

    if download_file(zenodo_url, dest_path, "Central Acts JSON"):
        extract_path.mkdir(exist_ok=True)
        try:
            with zipfile.ZipFile(dest_path, 'r') as zip_ref:
                zip_ref.extractall(extract_path)
            print(f"✅ Extracted to {extract_path}")
            return True
        except zipfile.BadZipFile:
            print("⚠️ Could not extract - may need manual download from https://zenodo.org/records/5088102")
            return False
    return False


def download_huggingface_datasets():
    """Download datasets from Hugging Face"""
    print("\n" + "="*60)
    print("🤗 Downloading from Hugging Face...")
    print("="*60)

    try:
        from datasets import load_dataset

        # 1. Indian Supreme Court Judgments (Chunked for RAG)
        print("\n📥 Loading Indian SC Judgments (chunked)...")
        try:
            sc_dataset = load_dataset(
                "vihaannnn/Indian-Supreme-Court-Judgements-Chunked",
                trust_remote_code=True
            )
            sc_path = DATASETS_DIR / "sc_judgments_chunked"
            sc_path.mkdir(exist_ok=True)
            sc_dataset.save_to_disk(str(sc_path))
            print(f"✅ Saved SC Judgments to {sc_path}")
        except Exception as e:
            print(f"⚠️ Error loading SC Judgments: {e}")

        # 2. Indian Legal Dataset
        print("\n📥 Loading Indian Legal Dataset...")
        try:
            legal_dataset = load_dataset("ninadn/indian-legal", trust_remote_code=True)
            legal_path = DATASETS_DIR / "indian_legal"
            legal_path.mkdir(exist_ok=True)
            legal_dataset.save_to_disk(str(legal_path))
            print(f"✅ Saved Indian Legal to {legal_path}")
        except Exception as e:
            print(f"⚠️ Error loading Indian Legal: {e}")

        return True
    except ImportError:
        print("⚠️ Install 'datasets' package: pip install datasets")
        return False


def download_kaggle_datasets():
    """Download datasets from Kaggle"""
    print("\n" + "="*60)
    print("📊 Downloading from Kaggle...")
    print("="*60)

    kaggle_datasets = [
        ("rowhitswami/all-indian-companies-registration-data-1900-2019", "indian_companies"),
        ("adarshsingh0903/legal-dataset-sc-judgments-india-19502024", "sc_judgments_1950_2024"),
        ("vangap/indian-supreme-court-judgments", "sc_judgments_vangap"),
        ("anshtanwar/list-of-startups", "indian_startups"),
    ]

    kaggle_path = DATASETS_DIR / "kaggle"
    kaggle_path.mkdir(exist_ok=True)

    print("\n⚠️  Kaggle requires authentication!")
    print("1. Go to https://www.kaggle.com/settings")
    print("2. Click 'Create New Token' to download kaggle.json")
    print("3. Place kaggle.json in ~/.kaggle/")
    print("4. Run: chmod 600 ~/.kaggle/kaggle.json\n")

    try:
        import kaggle
        for dataset_name, folder_name in kaggle_datasets:
            dest = kaggle_path / folder_name
            dest.mkdir(exist_ok=True)
            print(f"\n📥 Downloading {dataset_name}...")
            try:
                kaggle.api.dataset_download_files(
                    dataset_name,
                    path=str(dest),
                    unzip=True
                )
                print(f"✅ Downloaded to {dest}")
            except Exception as e:
                print(f"⚠️ Error downloading {dataset_name}: {e}")
        return True
    except ImportError:
        print("⚠️ Install kaggle: pip install kaggle")
        return False
    except Exception as e:
        print(f"⚠️ Kaggle error: {e}")
        return False


def download_indian_kanoon_sample():
    """Create Indian Kanoon API integration info"""
    print("\n" + "="*60)
    print("⚖️ Setting up Indian Kanoon API...")
    print("="*60)

    api_info = {
        "name": "Indian Kanoon API",
        "base_url": "https://api.indiankanoon.org",
        "documentation": "https://api.indiankanoon.org/documentation/",
        "endpoints": {
            "search": "/search/?formInput={query}&pagenum={page}",
            "document": "/doc/{doc_id}/",
            "document_fragments": "/docfragment/{doc_id}/?formInput={query}"
        },
        "features": [
            "Full-text legal search",
            "Supreme Court judgments",
            "High Court judgments",
            "Tribunal decisions",
            "Central and State Acts",
            "Structural analysis of judgments",
            "Citation analysis"
        ],
        "auth": "API key required - register at https://api.indiankanoon.org",
        "pricing": "Contact Indian Kanoon for pricing",
        "note": "Free tier may be available for research/educational use"
    }

    api_path = DATASETS_DIR / "api_configs"
    api_path.mkdir(exist_ok=True)

    with open(api_path / "indian_kanoon.json", 'w') as f:
        json.dump(api_info, f, indent=2)

    print(f"✅ API config saved to {api_path / 'indian_kanoon.json'}")
    return True


def download_data_gov_in_info():
    """Create data.gov.in download info"""
    print("\n" + "="*60)
    print("🏛️ Setting up data.gov.in info...")
    print("="*60)

    info = {
        "name": "data.gov.in - Company Master Data",
        "url": "https://www.data.gov.in/catalog/company-master-data",
        "description": "Official MCA company registration data",
        "fields": [
            "CIN", "Company Name", "Status", "Class", "Category",
            "Authorized Capital", "Paid-up Capital", "Registration Date",
            "State", "RoC", "Business Activity", "Address"
        ],
        "format": "CSV (ZIP compressed)",
        "records": "17+ million companies",
        "manual_download": True,
        "instructions": [
            "1. Visit https://www.data.gov.in/catalog/company-master-data",
            "2. Click on the download link for the dataset",
            "3. Save the ZIP file to data/raw/",
            "4. Extract to data/datasets/company_master/"
        ]
    }

    api_path = DATASETS_DIR / "api_configs"
    api_path.mkdir(exist_ok=True)

    with open(api_path / "data_gov_in.json", 'w') as f:
        json.dump(info, f, indent=2)

    print(f"✅ Config saved to {api_path / 'data_gov_in.json'}")
    return True


def download_ecourts_info():
    """Create eCourts portal info"""
    print("\n" + "="*60)
    print("⚖️ Setting up eCourts info...")
    print("="*60)

    info = {
        "name": "eCourts Judgment Search Portal",
        "url": "https://judgments.ecourts.gov.in",
        "description": "Official repository for High Court judgments",
        "search_options": [
            "Bench", "Case Type", "Case Number", "Year",
            "Petitioner/Respondent Name", "Judge Name",
            "Act", "Section", "Full-text keywords"
        ],
        "coverage": "All High Courts of India",
        "api_available": False,
        "alternative": {
            "name": "AWS Open Data - Indian High Court Judgments",
            "url": "https://registry.opendata.aws/indian-high-court-judgments/",
            "format": "JSON + Parquet",
            "bulk_download": True
        }
    }

    api_path = DATASETS_DIR / "api_configs"
    with open(api_path / "ecourts.json", 'w') as f:
        json.dump(info, f, indent=2)

    print(f"✅ Config saved to {api_path / 'ecourts.json'}")
    return True


def create_sample_legal_data():
    """Create sample legal data for testing"""
    print("\n" + "="*60)
    print("📝 Creating sample legal data...")
    print("="*60)

    sample_path = DATASETS_DIR / "samples"
    sample_path.mkdir(exist_ok=True)

    # Sample Companies Act sections
    companies_act_sections = [
        {
            "act": "Companies Act, 2013",
            "section": "2",
            "title": "Definitions",
            "content": "In this Act, unless the context otherwise requires,— (1) 'abridged prospectus' means a memorandum containing such salient features of a prospectus as may be specified by the Securities and Exchange Board by making regulations in this behalf..."
        },
        {
            "act": "Companies Act, 2013",
            "section": "7",
            "title": "Incorporation of company",
            "content": "(1) There shall be filed with the Registrar within whose jurisdiction the registered office of a company is proposed to be situated, the following documents and information for registration, namely:— (a) the memorandum and articles of the company duly signed by all the subscribers to the memorandum..."
        },
        {
            "act": "Companies Act, 2013",
            "section": "149",
            "title": "Company to have Board of Directors",
            "content": "(1) Every company shall have a Board of Directors consisting of individuals as directors and shall have— (a) a minimum number of three directors in the case of a public company, two directors in the case of a private company, and one director in the case of a One Person Company..."
        }
    ]

    # Sample case law summaries
    case_summaries = [
        {
            "case_name": "Salomon v. Salomon & Co. Ltd",
            "citation": "(1897) AC 22",
            "court": "House of Lords (UK, but followed in India)",
            "principle": "Separate Legal Entity",
            "summary": "A company is a separate legal entity distinct from its members. The corporate veil separates the company from its shareholders.",
            "relevance": "Foundation of company law - companies have independent legal personality"
        },
        {
            "case_name": "Tata Consultancy Services v. State of Andhra Pradesh",
            "citation": "(2005) 1 SCC 308",
            "court": "Supreme Court of India",
            "principle": "Software as Goods",
            "summary": "Computer software, when put on a medium and sold, is goods liable to sales tax.",
            "relevance": "Important for tech companies and taxation"
        },
        {
            "case_name": "Life Insurance Corporation of India v. Escorts Ltd",
            "citation": "(1986) 1 SCC 264",
            "court": "Supreme Court of India",
            "principle": "Lifting Corporate Veil",
            "summary": "The court can lift the corporate veil when the company is used as a device for tax evasion or circumventing tax obligations.",
            "relevance": "Important for understanding when separate entity principle can be disregarded"
        }
    ]

    # Sample founder agreement clauses
    founder_agreement_clauses = [
        {
            "clause_type": "Vesting Schedule",
            "standard_terms": "4-year vesting with 1-year cliff",
            "sample_text": "Each Founder's equity shall vest over a period of forty-eight (48) months, with a twelve (12) month cliff. Upon the cliff date, 25% of the Founder's equity shall vest, with the remaining 75% vesting monthly over the subsequent 36 months."
        },
        {
            "clause_type": "Non-Compete",
            "standard_terms": "12-24 months post-employment",
            "sample_text": "During the term of this Agreement and for a period of [12/24] months following termination, the Founder shall not, directly or indirectly, engage in any business that competes with the Company's business within India."
        },
        {
            "clause_type": "IP Assignment",
            "standard_terms": "All work product belongs to company",
            "sample_text": "The Founder hereby irrevocably assigns to the Company all right, title, and interest in and to any and all Inventions, including all Intellectual Property Rights therein, that the Founder may solely or jointly conceive, develop, or reduce to practice during the term of this Agreement."
        },
        {
            "clause_type": "Dispute Resolution",
            "standard_terms": "Arbitration in India",
            "sample_text": "Any dispute arising out of or in connection with this Agreement shall be finally resolved by arbitration in accordance with the Arbitration and Conciliation Act, 1996. The seat of arbitration shall be [City], India. The arbitration shall be conducted in English."
        }
    ]

    # Save sample data
    with open(sample_path / "companies_act_sections.json", 'w') as f:
        json.dump(companies_act_sections, f, indent=2)

    with open(sample_path / "case_summaries.json", 'w') as f:
        json.dump(case_summaries, f, indent=2)

    with open(sample_path / "founder_agreement_clauses.json", 'w') as f:
        json.dump(founder_agreement_clauses, f, indent=2)

    print(f"✅ Sample data saved to {sample_path}")
    return True


def main():
    print("="*60)
    print("🚀 JurisGPT Dataset Downloader")
    print("="*60)
    print(f"\nBase directory: {BASE_DIR}")
    print(f"Raw downloads: {RAW_DIR}")
    print(f"Processed datasets: {DATASETS_DIR}")

    results = {
        "GitHub Indian Law JSON": download_github_indian_law_json(),
        "Zenodo Central Acts": download_zenodo_central_acts(),
        "Hugging Face Datasets": download_huggingface_datasets(),
        "Kaggle Datasets": download_kaggle_datasets(),
        "Indian Kanoon API Config": download_indian_kanoon_sample(),
        "data.gov.in Config": download_data_gov_in_info(),
        "eCourts Config": download_ecourts_info(),
        "Sample Legal Data": create_sample_legal_data(),
    }

    print("\n" + "="*60)
    print("📊 Download Summary")
    print("="*60)
    for name, success in results.items():
        status = "✅" if success else "⚠️"
        print(f"{status} {name}")

    print("\n" + "="*60)
    print("📋 Next Steps")
    print("="*60)
    print("1. Set up Kaggle credentials if not done")
    print("2. Manually download data.gov.in company data")
    print("3. Register for Indian Kanoon API (optional)")
    print("4. Run: python process_datasets.py")
    print("5. Run: python build_vector_store.py")


if __name__ == "__main__":
    main()
