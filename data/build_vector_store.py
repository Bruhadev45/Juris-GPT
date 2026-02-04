#!/usr/bin/env python3
"""
JurisGPT Vector Store Builder
Builds ChromaDB vector store from processed documents for RAG
"""

import json
from pathlib import Path
from typing import List, Dict, Any
from tqdm import tqdm
import hashlib

BASE_DIR = Path(__file__).parent
PROCESSED_DIR = BASE_DIR / "processed"
VECTORS_DIR = BASE_DIR / "vectors"
VECTORS_DIR.mkdir(exist_ok=True)


def get_embedding_function(model_type: str = "sentence_transformers"):
    """Get embedding function based on model type"""

    if model_type == "openai":
        try:
            from langchain_openai import OpenAIEmbeddings
            import os
            if not os.getenv("OPENAI_API_KEY"):
                print("⚠️ OPENAI_API_KEY not set. Using sentence-transformers instead.")
                return get_embedding_function("sentence_transformers")
            return OpenAIEmbeddings(model="text-embedding-3-small")
        except ImportError:
            print("⚠️ langchain-openai not installed. Using sentence-transformers.")
            return get_embedding_function("sentence_transformers")

    else:  # sentence_transformers (default, free)
        try:
            from langchain_community.embeddings import HuggingFaceEmbeddings
            return HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                model_kwargs={'device': 'cpu'},
                encode_kwargs={'normalize_embeddings': True}
            )
        except ImportError:
            from langchain_community.embeddings import SentenceTransformerEmbeddings
            return SentenceTransformerEmbeddings(
                model_name="all-MiniLM-L6-v2"
            )


def load_chunks() -> List[Dict[str, Any]]:
    """Load processed chunks"""
    chunks_path = PROCESSED_DIR / "all_chunks.json"

    if not chunks_path.exists():
        print(f"⚠️ Chunks file not found: {chunks_path}")
        print("Run process_datasets.py first.")
        return []

    with open(chunks_path, 'r', encoding='utf-8') as f:
        chunks = json.load(f)

    print(f"✅ Loaded {len(chunks)} chunks")
    return chunks


def build_chroma_store(chunks: List[Dict[str, Any]], embedding_type: str = "sentence_transformers"):
    """Build ChromaDB vector store"""
    print(f"\n🔨 Building ChromaDB vector store...")
    print(f"Embedding model: {embedding_type}")

    try:
        import chromadb
        from chromadb.config import Settings
    except ImportError:
        print("❌ ChromaDB not installed. Run: pip install chromadb")
        return None

    # Initialize ChromaDB
    chroma_path = VECTORS_DIR / "chroma_db"
    chroma_path.mkdir(exist_ok=True)

    client = chromadb.PersistentClient(
        path=str(chroma_path),
        settings=Settings(anonymized_telemetry=False)
    )

    # Get or create collection
    collection_name = "jurisgpt_legal"
    try:
        # Delete existing collection if it exists
        client.delete_collection(collection_name)
    except Exception:
        pass

    collection = client.create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"}
    )

    # Get embeddings
    print("\n📊 Generating embeddings...")
    embeddings_fn = get_embedding_function(embedding_type)

    # Process in batches
    batch_size = 100
    total_batches = (len(chunks) + batch_size - 1) // batch_size

    for i in tqdm(range(0, len(chunks), batch_size), total=total_batches, desc="Embedding"):
        batch = chunks[i:i + batch_size]

        # Prepare batch data
        ids = [chunk["chunk_id"] for chunk in batch]
        documents = [chunk["content"] for chunk in batch]
        metadatas = [
            {
                "doc_id": chunk["doc_id"],
                "title": chunk["title"],
                "doc_type": chunk["doc_type"],
                "source": chunk["metadata"].get("source", "unknown"),
                "chunk_index": chunk["chunk_index"],
                "total_chunks": chunk["total_chunks"]
            }
            for chunk in batch
        ]

        # Generate embeddings
        try:
            embeddings = embeddings_fn.embed_documents(documents)

            # Add to collection
            collection.add(
                ids=ids,
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas
            )
        except Exception as e:
            print(f"\n⚠️ Error embedding batch {i//batch_size}: {e}")
            continue

    print(f"\n✅ ChromaDB store built with {collection.count()} vectors")
    print(f"📁 Stored at: {chroma_path}")

    return client, collection


def build_faiss_store(chunks: List[Dict[str, Any]], embedding_type: str = "sentence_transformers"):
    """Build FAISS vector store (alternative to ChromaDB)"""
    print(f"\n🔨 Building FAISS vector store...")

    try:
        from langchain_community.vectorstores import FAISS
    except ImportError:
        print("❌ FAISS not installed. Run: pip install faiss-cpu")
        return None

    embeddings_fn = get_embedding_function(embedding_type)

    # Prepare documents
    from langchain.schema import Document
    documents = [
        Document(
            page_content=chunk["content"],
            metadata={
                "chunk_id": chunk["chunk_id"],
                "doc_id": chunk["doc_id"],
                "title": chunk["title"],
                "doc_type": chunk["doc_type"],
                "source": chunk["metadata"].get("source", "unknown")
            }
        )
        for chunk in chunks
    ]

    print(f"📊 Creating FAISS index with {len(documents)} documents...")

    # Build FAISS index
    vector_store = FAISS.from_documents(
        documents,
        embeddings_fn,
        normalize_L2=True
    )

    # Save
    faiss_path = VECTORS_DIR / "faiss_index"
    vector_store.save_local(str(faiss_path))

    print(f"\n✅ FAISS store built")
    print(f"📁 Stored at: {faiss_path}")

    return vector_store


def test_vector_store():
    """Test the vector store with sample queries"""
    print("\n🧪 Testing vector store...")

    try:
        import chromadb
        from chromadb.config import Settings

        chroma_path = VECTORS_DIR / "chroma_db"
        if not chroma_path.exists():
            print("⚠️ ChromaDB not found. Build it first.")
            return

        client = chromadb.PersistentClient(
            path=str(chroma_path),
            settings=Settings(anonymized_telemetry=False)
        )
        collection = client.get_collection("jurisgpt_legal")

        embeddings_fn = get_embedding_function()

        test_queries = [
            "What is the vesting schedule for founder equity?",
            "What is Section 7 of Companies Act?",
            "What is the corporate veil doctrine?",
            "Non-compete clause in founder agreements",
            "Arbitration for dispute resolution"
        ]

        print("\n" + "="*60)
        for query in test_queries:
            print(f"\n🔍 Query: {query}")
            print("-"*40)

            # Get query embedding
            query_embedding = embeddings_fn.embed_query(query)

            # Search
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=3
            )

            for i, (doc, metadata) in enumerate(zip(
                results['documents'][0],
                results['metadatas'][0]
            )):
                print(f"\n📄 Result {i+1}: {metadata.get('title', 'Unknown')[:50]}...")
                print(f"   Type: {metadata.get('doc_type')}")
                print(f"   Source: {metadata.get('source')}")
                print(f"   Content: {doc[:150]}...")

    except Exception as e:
        print(f"❌ Test failed: {e}")


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Build vector store for JurisGPT")
    parser.add_argument(
        "--embedding",
        choices=["sentence_transformers", "openai"],
        default="sentence_transformers",
        help="Embedding model to use (default: sentence_transformers, free)"
    )
    parser.add_argument(
        "--store",
        choices=["chroma", "faiss", "both"],
        default="chroma",
        help="Vector store type (default: chroma)"
    )
    parser.add_argument(
        "--test",
        action="store_true",
        help="Run tests after building"
    )

    args = parser.parse_args()

    print("="*60)
    print("🚀 JurisGPT Vector Store Builder")
    print("="*60)

    # Load chunks
    chunks = load_chunks()
    if not chunks:
        return

    # Build vector store(s)
    if args.store in ["chroma", "both"]:
        build_chroma_store(chunks, args.embedding)

    if args.store in ["faiss", "both"]:
        build_faiss_store(chunks, args.embedding)

    # Test if requested
    if args.test:
        test_vector_store()

    print("\n" + "="*60)
    print("✅ Vector Store Build Complete!")
    print("="*60)
    print("\nNext steps:")
    print("1. Use the RAG pipeline: from rag_pipeline import JurisGPTRAG")
    print("2. Or run: python rag_pipeline.py --query 'Your legal question'")


if __name__ == "__main__":
    main()
