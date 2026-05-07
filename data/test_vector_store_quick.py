#!/usr/bin/env python3
"""Quick test of existing ChromaDB vector store"""

from pathlib import Path

BASE_DIR = Path(__file__).parent
VECTORS_DIR = BASE_DIR / "vectors"

def test_chroma():
    """Test the existing ChromaDB"""
    print("Testing existing ChromaDB vector store...")

    try:
        import chromadb
        from chromadb.config import Settings

        chroma_path = VECTORS_DIR / "chroma_db"
        if not chroma_path.exists():
            print("ChromaDB directory not found!")
            return False

        client = chromadb.PersistentClient(
            path=str(chroma_path),
            settings=Settings(anonymized_telemetry=False)
        )

        collection = client.get_collection("jurisgpt_legal")
        count = collection.count()

        print(f"\n✅ ChromaDB found with {count:,} vectors")

        if count > 0:
            # Try a simple query
            results = collection.query(
                query_texts=["What is Section 7 of Companies Act?"],
                n_results=3
            )

            print(f"\n🔍 Sample query test passed:")
            print(f"   Found {len(results['documents'][0])} results")
            for i, (doc, metadata) in enumerate(zip(
                results['documents'][0],
                results['metadatas'][0]
            )):
                print(f"\n   Result {i+1}: {metadata.get('title', 'Unknown')[:60]}...")
                print(f"   Type: {metadata.get('doc_type')}")

            return True
        else:
            print("❌ No vectors in collection")
            return False

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_chroma()
    print("\n" + "="*60)
    if success:
        print("✅ Vector store is usable!")
    else:
        print("❌ Vector store test failed")
    print("="*60)
