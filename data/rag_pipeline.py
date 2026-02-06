#!/usr/bin/env python3
"""
NyayaSetu RAG Pipeline
Retrieval-Augmented Generation for Indian Legal Queries
"""

import json
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv(Path(__file__).parent / ".env")
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

BASE_DIR = Path(__file__).parent
VECTORS_DIR = BASE_DIR / "vectors"
PROCESSED_DIR = BASE_DIR / "processed"


@dataclass
class RetrievedDocument:
    """A retrieved document from the vector store"""
    content: str
    title: str
    doc_type: str
    source: str
    score: float
    metadata: Dict[str, Any]


@dataclass
class RAGResponse:
    """Response from the RAG pipeline"""
    answer: str
    sources: List[RetrievedDocument]
    query: str
    model_used: str


class NyayaSetuRAG:
    """RAG Pipeline for NyayaSetu Legal Chatbot"""

    def __init__(
        self,
        vector_store_type: str = "chroma",
        embedding_type: str = "sentence_transformers",
        llm_type: str = "openai",
        top_k: int = 5
    ):
        self.vector_store_type = vector_store_type
        self.embedding_type = embedding_type
        self.llm_type = llm_type
        self.top_k = top_k

        self.embeddings = None
        self.vector_store = None
        self.llm = None

        self._initialize()

    def _initialize(self):
        """Initialize embeddings, vector store, and LLM"""
        print("🔧 Initializing NyayaSetu RAG Pipeline...")

        # Initialize embeddings
        self._init_embeddings()

        # Initialize vector store
        self._init_vector_store()

        # Initialize LLM
        self._init_llm()

        print("✅ RAG Pipeline initialized!")

    def _init_embeddings(self):
        """Initialize embedding model"""
        if self.embedding_type == "openai":
            try:
                from langchain_openai import OpenAIEmbeddings
                import os
                if os.getenv("OPENAI_API_KEY"):
                    self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
                    print("   📊 Using OpenAI embeddings")
                    return
            except ImportError:
                pass

        # Default to sentence-transformers (free)
        try:
            from langchain_huggingface import HuggingFaceEmbeddings
            self.embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                model_kwargs={'device': 'cpu'},
                encode_kwargs={'normalize_embeddings': True}
            )
            print("   📊 Using HuggingFace embeddings (free)")
        except ImportError:
            from sentence_transformers import SentenceTransformer
            self.embeddings = SentenceTransformerEmbeddings()
            print("   📊 Using SentenceTransformer embeddings (free)")

    def _init_vector_store(self):
        """Initialize vector store"""
        if self.vector_store_type == "chroma":
            self._init_chroma()
        else:
            self._init_faiss()

    def _init_chroma(self):
        """Initialize ChromaDB"""
        try:
            import chromadb
            from chromadb.config import Settings

            chroma_path = VECTORS_DIR / "chroma_db"
            if not chroma_path.exists():
                raise FileNotFoundError(f"ChromaDB not found at {chroma_path}")

            client = chromadb.PersistentClient(
                path=str(chroma_path),
                settings=Settings(anonymized_telemetry=False)
            )
            self.collection = client.get_collection("jurisgpt_legal")
            self.vector_store = "chroma"
            print(f"   🗄️ ChromaDB loaded ({self.collection.count()} vectors)")
        except Exception as e:
            print(f"   ⚠️ ChromaDB error: {e}")
            self._init_faiss()

    def _init_faiss(self):
        """Initialize FAISS"""
        try:
            from langchain_community.vectorstores import FAISS

            faiss_path = VECTORS_DIR / "faiss_index"
            if not faiss_path.exists():
                raise FileNotFoundError(f"FAISS index not found at {faiss_path}")

            self.faiss_store = FAISS.load_local(
                str(faiss_path),
                self.embeddings,
                allow_dangerous_deserialization=True
            )
            self.vector_store = "faiss"
            print("   🗄️ FAISS index loaded")
        except Exception as e:
            print(f"   ⚠️ FAISS error: {e}")
            self.vector_store = None

    def _init_llm(self):
        """Initialize LLM for generation"""
        import os

        if self.llm_type == "openai" and os.getenv("OPENAI_API_KEY"):
            try:
                from langchain_openai import ChatOpenAI
                self.llm = ChatOpenAI(
                    model="gpt-4o-mini",
                    temperature=0.3,
                    max_tokens=4000
                )
                print("   🤖 Using OpenAI GPT-4o-mini")
                return
            except ImportError:
                pass

        # Fallback: No LLM, just retrieval
        self.llm = None
        print("   🤖 No LLM configured (retrieval-only mode)")
        print("      Set OPENAI_API_KEY for full RAG functionality")

    def retrieve(self, query: str, top_k: int = None) -> List[RetrievedDocument]:
        """Retrieve relevant documents for a query"""
        k = top_k or self.top_k
        results = []

        if self.vector_store == "chroma" and hasattr(self, 'collection'):
            # Get query embedding
            query_embedding = self.embeddings.embed_query(query)

            # Search
            search_results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=k,
                include=['documents', 'metadatas', 'distances']
            )

            for i, (doc, metadata, distance) in enumerate(zip(
                search_results['documents'][0],
                search_results['metadatas'][0],
                search_results['distances'][0]
            )):
                # Convert distance to similarity score (cosine)
                score = 1 - distance

                results.append(RetrievedDocument(
                    content=doc,
                    title=metadata.get('title', 'Unknown'),
                    doc_type=metadata.get('doc_type', 'unknown'),
                    source=metadata.get('source', 'unknown'),
                    score=score,
                    metadata=metadata
                ))

        elif self.vector_store == "faiss" and hasattr(self, 'faiss_store'):
            docs_with_scores = self.faiss_store.similarity_search_with_score(query, k=k)

            for doc, score in docs_with_scores:
                results.append(RetrievedDocument(
                    content=doc.page_content,
                    title=doc.metadata.get('title', 'Unknown'),
                    doc_type=doc.metadata.get('doc_type', 'unknown'),
                    source=doc.metadata.get('source', 'unknown'),
                    score=float(score),
                    metadata=doc.metadata
                ))

        return results

    def generate_answer(self, query: str, context_docs: List[RetrievedDocument]) -> str:
        """Generate answer using LLM with retrieved context"""
        if not self.llm:
            # Retrieval-only mode
            return self._format_retrieval_only_response(context_docs)

        # Build context
        context = "\n\n---\n\n".join([
            f"**{doc.title}** ({doc.doc_type})\n{doc.content}"
            for doc in context_docs
        ])

        # System prompt for legal assistant
        system_prompt = """You are NyayaSetu, an AI legal assistant specializing in Indian law, particularly for startups and company formation.

Your role is to:
1. Answer legal questions accurately based on the provided context
2. Cite specific acts, sections, and case laws when relevant
3. Explain legal concepts in simple terms
4. Provide practical guidance for Indian startups
5. Draft legal documents, templates, notices, petitions, agreements, and case files when asked

DOCUMENT DRAFTING:
When the user asks you to draft, create, generate, or provide a template for any legal document (e.g., case file, legal notice, petition, agreement, affidavit, contract, MoU, NDA, power of attorney, complaint, FIR draft, lease agreement, employment contract, board resolution, etc.):
- Generate a COMPLETE, professionally formatted legal document
- Include all standard sections, clauses, and legal language
- Use proper legal formatting with numbered sections and subsections
- Include placeholder text in [BRACKETS] for details the user needs to fill in (e.g., [PARTY NAME], [DATE], [ADDRESS])
- Reference applicable Indian laws, acts, and sections
- Add a disclaimer at the end that the document should be reviewed by a qualified lawyer before use
- Make the document as comprehensive and ready-to-use as possible

FORMATTING RULES:
- Use markdown formatting for better readability
- Use **bold** for section headings and important terms
- Use numbered lists (1, 2, 3) for clauses and sections
- Use --- for section separators in documents
- For legal documents, use proper structure: Title, Parties, Recitals, Clauses, Signatures

Other guidelines:
- Answer based on the provided context and your legal knowledge
- Always mention relevant legal provisions (e.g., Section 7 of Companies Act, 2013)
- Highlight important caveats or when professional legal advice is needed
- Be comprehensive - especially when drafting documents

Context from legal database:
{context}
"""

        # Create prompt
        from langchain_core.prompts import ChatPromptTemplate
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{query}")
        ])

        # Generate response
        chain = prompt | self.llm
        response = chain.invoke({
            "context": context,
            "query": query
        })

        return response.content

    def _format_retrieval_only_response(self, docs: List[RetrievedDocument]) -> str:
        """Format response when no LLM is available"""
        response = "Retrieved Legal Information:\n\n"

        for i, doc in enumerate(docs, 1):
            response += f"{i}. {doc.title}\n"
            response += f"   Type: {doc.doc_type} | Source: {doc.source}\n"
            response += f"   Relevance Score: {doc.score:.0%}\n\n"
            response += f"   {doc.content[:500]}...\n\n"

        response += "\nNote: Set OPENAI_API_KEY for AI-generated answers based on this context."
        return response

    def query(self, query: str, top_k: int = None) -> RAGResponse:
        """Main RAG query method"""
        # Retrieve relevant documents
        retrieved_docs = self.retrieve(query, top_k)

        # Generate answer
        answer = self.generate_answer(query, retrieved_docs)

        return RAGResponse(
            answer=answer,
            sources=retrieved_docs,
            query=query,
            model_used=self.llm_type if self.llm else "retrieval-only"
        )

    def chat(self, query: str) -> str:
        """Simple chat interface"""
        response = self.query(query)

        output = f"\n{'='*60}\n"
        output += f"🔍 **Query:** {query}\n"
        output += f"{'='*60}\n\n"
        output += f"📝 **Answer:**\n{response.answer}\n\n"
        output += f"{'='*60}\n"
        output += f"📚 **Sources ({len(response.sources)}):**\n"

        for i, source in enumerate(response.sources, 1):
            output += f"\n{i}. **{source.title}**\n"
            output += f"   Type: {source.doc_type} | Score: {source.score:.2%}\n"

        return output


class NyayaSetuChatbot:
    """Chatbot wrapper for integration with FastAPI backend"""

    def __init__(self):
        self.rag = None
        self._initialized = False

    def initialize(self):
        """Lazy initialization"""
        if not self._initialized:
            try:
                self.rag = NyayaSetuRAG()
                self._initialized = True
            except Exception as e:
                print(f"⚠️ RAG initialization failed: {e}")
                self._initialized = False

    def get_response(self, query: str) -> Dict[str, Any]:
        """Get chatbot response for API integration"""
        self.initialize()

        if not self._initialized or not self.rag:
            return {
                "success": False,
                "error": "RAG pipeline not initialized. Run setup scripts first.",
                "answer": None,
                "sources": []
            }

        try:
            response = self.rag.query(query)
            return {
                "success": True,
                "answer": response.answer,
                "sources": [
                    {
                        "title": s.title,
                        "content": s.content[:300] + "..." if len(s.content) > 300 else s.content,
                        "doc_type": s.doc_type,
                        "source": s.source,
                        "score": s.score
                    }
                    for s in response.sources
                ],
                "model_used": response.model_used
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "answer": None,
                "sources": []
            }


# Global chatbot instance for FastAPI
chatbot = NyayaSetuChatbot()


def main():
    """CLI interface for testing"""
    import argparse

    parser = argparse.ArgumentParser(description="NyayaSetu RAG Pipeline")
    parser.add_argument("--query", "-q", type=str, help="Legal query to answer")
    parser.add_argument("--interactive", "-i", action="store_true", help="Interactive mode")

    args = parser.parse_args()

    # Initialize RAG
    rag = NyayaSetuRAG()

    if args.query:
        print(rag.chat(args.query))
    elif args.interactive:
        print("\n" + "="*60)
        print("🤖 NyayaSetu Legal Assistant")
        print("="*60)
        print("Ask any legal question about Indian law, company formation,")
        print("or founder agreements. Type 'quit' to exit.\n")

        while True:
            try:
                query = input("\n💬 You: ").strip()
                if query.lower() in ['quit', 'exit', 'q']:
                    print("👋 Goodbye!")
                    break
                if not query:
                    continue
                print(rag.chat(query))
            except KeyboardInterrupt:
                print("\n👋 Goodbye!")
                break
    else:
        # Demo queries
        demo_queries = [
            "What is the vesting schedule for founder equity?",
            "How do I incorporate a company in India?",
            "What is Section 149 of Companies Act about?"
        ]

        print("\n🎯 Running demo queries...\n")
        for query in demo_queries:
            print(rag.chat(query))
            print("\n")


if __name__ == "__main__":
    main()
