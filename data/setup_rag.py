#!/usr/bin/env python3
"""
JurisGPT RAG Setup Script
One-click setup for the entire RAG pipeline
"""

import subprocess
import sys
from pathlib import Path

BASE_DIR = Path(__file__).parent


def run_command(cmd: list, desc: str) -> bool:
    """Run a command and return success status"""
    print(f"\n{'='*60}")
    print(f"🔧 {desc}")
    print(f"{'='*60}")
    try:
        result = subprocess.run(cmd, cwd=str(BASE_DIR), check=True)
        return result.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
        return False
    except FileNotFoundError as e:
        print(f"❌ Command not found: {e}")
        return False


def check_python():
    """Check Python version"""
    print(f"Python version: {sys.version}")
    if sys.version_info < (3, 9):
        print("⚠️ Python 3.9+ recommended")
        return False
    return True


def install_dependencies():
    """Install required packages"""
    return run_command(
        [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
        "Installing dependencies..."
    )


def download_datasets():
    """Download all datasets"""
    return run_command(
        [sys.executable, "download_datasets.py"],
        "Downloading datasets..."
    )


def process_datasets():
    """Process downloaded datasets"""
    return run_command(
        [sys.executable, "process_datasets.py"],
        "Processing datasets..."
    )


def build_vector_store():
    """Build vector store"""
    return run_command(
        [sys.executable, "build_vector_store.py", "--test"],
        "Building vector store..."
    )


def main():
    print("""
╔══════════════════════════════════════════════════════════╗
║           JurisGPT RAG Pipeline Setup                    ║
║     AI-Powered Legal Assistant for Indian Startups       ║
╚══════════════════════════════════════════════════════════╝
    """)

    steps = [
        ("Checking Python version", check_python),
        ("Installing dependencies", install_dependencies),
        ("Downloading datasets", download_datasets),
        ("Processing datasets", process_datasets),
        ("Building vector store", build_vector_store),
    ]

    results = {}
    for step_name, step_func in steps:
        print(f"\n📋 Step: {step_name}")
        success = step_func()
        results[step_name] = success
        if not success:
            print(f"\n⚠️ Step '{step_name}' had issues. Continuing...")

    # Summary
    print("\n" + "="*60)
    print("📊 Setup Summary")
    print("="*60)
    for step_name, success in results.items():
        status = "✅" if success else "⚠️"
        print(f"{status} {step_name}")

    print("\n" + "="*60)
    print("🎉 Setup Complete!")
    print("="*60)
    print("""
Next Steps:
-----------
1. Set up your API keys in data/.env:
   - OPENAI_API_KEY (required for full functionality)
   - KAGGLE credentials for more datasets

2. For Kaggle datasets (optional):
   - Go to https://www.kaggle.com/settings
   - Create API token and save to ~/.kaggle/kaggle.json
   - Re-run: python download_datasets.py

3. Test the chatbot:
   python rag_pipeline.py --interactive

4. Start the backend:
   cd ../backend
   source venv/bin/activate
   uvicorn app.main:app --reload

5. Access the chatbot API:
   POST http://localhost:8000/api/chat/message
   {"message": "How do I incorporate a company in India?"}
""")


if __name__ == "__main__":
    main()
