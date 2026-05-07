"""
Indian Kanoon API Integration Service
=====================================
Provides real-time access to Indian legal cases, judgments, and statutes.
Requires API key from https://api.indiankanoon.org
"""

import httpx
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging
from functools import lru_cache

from app.config import settings

logger = logging.getLogger(__name__)


class IndianKanoonClient:
    """
    Client for Indian Kanoon API - India's largest legal search engine.

    Features:
    - Supreme Court judgments
    - High Court judgments (all 25 courts)
    - Tribunal decisions
    - Central and State Acts
    - Citation analysis
    """

    BASE_URL = "https://api.indiankanoon.org"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or getattr(settings, 'INDIAN_KANOON_API_KEY', None)
        self.headers = {}
        if self.api_key:
            self.headers["Authorization"] = f"Token {self.api_key}"
        self._client = None

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.BASE_URL,
                headers=self.headers,
                timeout=30.0
            )
        return self._client

    async def close(self):
        if self._client:
            await self._client.aclose()
            self._client = None

    async def search_cases(
        self,
        query: str,
        page: int = 0,
        court_filter: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        doc_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Search Indian legal cases and documents.

        Args:
            query: Search query (supports boolean operators: AND, OR, NOT)
            page: Page number (0-indexed)
            court_filter: Filter by court (e.g., "supremecourt", "delhihighcourt")
            from_date: Filter from date (YYYY-MM-DD)
            to_date: Filter to date (YYYY-MM-DD)
            doc_type: Filter by document type ("judgments", "acts", etc.)

        Returns:
            Dict with search results including cases, acts, and other documents
        """
        if not self.api_key:
            return self._get_demo_results(query)

        # Build search query with filters
        search_query = query
        if court_filter:
            search_query += f" doctypes: {court_filter}"
        if from_date:
            search_query += f" fromdate: {from_date}"
        if to_date:
            search_query += f" todate: {to_date}"
        if doc_type:
            search_query += f" doctypes: {doc_type}"

        try:
            response = await self.client.post(
                "/search/",
                data={"formInput": search_query, "pagenum": page}
            )
            response.raise_for_status()
            return self._parse_search_results(response.json())
        except httpx.HTTPError as e:
            logger.error(f"Indian Kanoon API error: {e}")
            return self._get_demo_results(query)

    async def get_document(self, doc_id: str) -> Dict[str, Any]:
        """
        Get full document by ID.

        Args:
            doc_id: Document ID from search results

        Returns:
            Dict with full document content and metadata
        """
        if not self.api_key:
            return self._get_demo_document(doc_id)

        try:
            response = await self.client.get(f"/doc/{doc_id}/")
            response.raise_for_status()
            return self._parse_document(response.json())
        except httpx.HTTPError as e:
            logger.error(f"Indian Kanoon document fetch error: {e}")
            return self._get_demo_document(doc_id)

    async def get_recent_supreme_court_cases(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recent Supreme Court judgments."""
        results = await self.search_cases(
            query="*",
            court_filter="supremecourt",
            page=0
        )
        return results.get("cases", [])[:limit]

    async def get_recent_high_court_cases(
        self,
        court: str = "delhihighcourt",
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Get recent High Court judgments.

        Args:
            court: Court code (e.g., "delhihighcourt", "bombayhighcourt",
                   "madras highcourt", "calcuttahighcourt", "karnatakaHighcourt")
        """
        results = await self.search_cases(
            query="*",
            court_filter=court,
            page=0
        )
        return results.get("cases", [])[:limit]

    async def search_by_act(self, act_name: str) -> List[Dict[str, Any]]:
        """Search for cases related to a specific act."""
        results = await self.search_cases(query=f'"{act_name}"')
        return results.get("cases", [])

    async def search_by_section(
        self,
        act_name: str,
        section: str
    ) -> List[Dict[str, Any]]:
        """Search for cases citing a specific section of an act."""
        query = f'"{act_name}" AND "Section {section}"'
        results = await self.search_cases(query=query)
        return results.get("cases", [])

    async def get_case_citations(self, doc_id: str) -> Dict[str, Any]:
        """Get cases that cite this document and cases this document cites."""
        if not self.api_key:
            return {"cited_by": [], "cites": []}

        try:
            response = await self.client.get(f"/citecheck/{doc_id}/")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Citation check error: {e}")
            return {"cited_by": [], "cites": []}

    def _parse_search_results(self, data: Dict) -> Dict[str, Any]:
        """Parse raw API response into structured format."""
        cases = []
        for doc in data.get("docs", []):
            cases.append({
                "id": doc.get("tid"),
                "title": doc.get("title", ""),
                "headline": doc.get("headline", ""),
                "court": doc.get("docsource", ""),
                "date": doc.get("publishdate", ""),
                "citation": doc.get("citation", ""),
                "doc_type": doc.get("doctype", ""),
                "url": f"https://indiankanoon.org/doc/{doc.get('tid')}/",
                "snippet": doc.get("headline", "")[:500]
            })

        return {
            "total_results": data.get("numfound", 0),
            "page": data.get("pagenum", 0),
            "cases": cases,
            "query": data.get("formInput", "")
        }

    def _parse_document(self, data: Dict) -> Dict[str, Any]:
        """Parse raw document response."""
        return {
            "id": data.get("tid"),
            "title": data.get("title", ""),
            "content": data.get("doc", ""),
            "court": data.get("docsource", ""),
            "date": data.get("publishdate", ""),
            "citation": data.get("citation", ""),
            "judges": data.get("author", []),
            "url": f"https://indiankanoon.org/doc/{data.get('tid')}/",
            "cited_docs": data.get("citeddocs", []),
            "citing_docs": data.get("citingdocs", [])
        }

    def _get_demo_results(self, query: str) -> Dict[str, Any]:
        """Return demo results when API key is not configured."""
        demo_cases = [
            {
                "id": "demo_1",
                "title": "Kesavananda Bharati v. State of Kerala",
                "headline": "Basic Structure Doctrine - Parliament cannot alter the basic structure of Constitution",
                "court": "Supreme Court of India",
                "date": "1973-04-24",
                "citation": "AIR 1973 SC 1461",
                "doc_type": "judgment",
                "url": "https://indiankanoon.org/doc/257876/",
                "snippet": "Parliament has wide powers to amend the Constitution but cannot alter its basic structure including supremacy of Constitution, republican form, separation of powers, and federal character."
            },
            {
                "id": "demo_2",
                "title": "K.S. Puttaswamy v. Union of India",
                "headline": "Right to Privacy is a Fundamental Right under Article 21",
                "court": "Supreme Court of India",
                "date": "2017-08-24",
                "citation": "(2017) 10 SCC 1",
                "doc_type": "judgment",
                "url": "https://indiankanoon.org/doc/91938676/",
                "snippet": "Right to privacy is a fundamental right under Article 21. It includes informational privacy, privacy of choice, and bodily integrity. Any invasion must meet tests of legality, necessity, and proportionality."
            },
            {
                "id": "demo_3",
                "title": "Vodafone International Holdings B.V. v. Union of India",
                "headline": "Indirect transfer of Indian assets not taxable under Income Tax Act",
                "court": "Supreme Court of India",
                "date": "2012-01-20",
                "citation": "(2012) 6 SCC 613",
                "doc_type": "judgment",
                "url": "https://indiankanoon.org/doc/115852355/",
                "snippet": "Transfer of shares of a foreign company holding Indian assets did not attract capital gains tax as situs of shares was outside India. Look at substance of transaction."
            },
            {
                "id": "demo_4",
                "title": "Shreya Singhal v. Union of India",
                "headline": "Section 66A of IT Act struck down as unconstitutional",
                "court": "Supreme Court of India",
                "date": "2015-03-24",
                "citation": "(2015) 5 SCC 1",
                "doc_type": "judgment",
                "url": "https://indiankanoon.org/doc/110813550/",
                "snippet": "Section 66A was struck down as vague and overbroad, violating Article 19(1)(a). Online speech entitled to same protection as offline speech."
            },
            {
                "id": "demo_5",
                "title": "Swiss Ribbons Pvt. Ltd. v. Union of India",
                "headline": "IBC constitutional validity upheld with modifications",
                "court": "Supreme Court of India",
                "date": "2019-01-25",
                "citation": "(2019) 4 SCC 17",
                "doc_type": "judgment",
                "url": "https://indiankanoon.org/doc/62748579/",
                "snippet": "Insolvency and Bankruptcy Code, 2016 is constitutional. The Code does not violate Article 14 by treating financial and operational creditors differently."
            }
        ]

        # Filter by query if provided
        if query and query != "*":
            query_lower = query.lower()
            demo_cases = [
                c for c in demo_cases
                if query_lower in c["title"].lower() or query_lower in c["headline"].lower()
            ]

        return {
            "total_results": len(demo_cases),
            "page": 0,
            "cases": demo_cases,
            "query": query,
            "is_demo": True,
            "message": "Demo results - Configure INDIAN_KANOON_API_KEY for real data"
        }

    def _get_demo_document(self, doc_id: str) -> Dict[str, Any]:
        """Return demo document when API key is not configured."""
        return {
            "id": doc_id,
            "title": "Demo Case Document",
            "content": "This is a demo document. Configure INDIAN_KANOON_API_KEY to fetch real case documents from Indian Kanoon.",
            "court": "Supreme Court of India",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "citation": "Demo Citation",
            "judges": ["Demo Judge"],
            "url": f"https://indiankanoon.org/doc/{doc_id}/",
            "is_demo": True
        }


# Singleton instance
_kanoon_client: Optional[IndianKanoonClient] = None


def get_kanoon_client() -> IndianKanoonClient:
    """Get or create Indian Kanoon client instance."""
    global _kanoon_client
    if _kanoon_client is None:
        _kanoon_client = IndianKanoonClient()
    return _kanoon_client


# Court codes for reference
COURT_CODES = {
    "supreme_court": "supremecourt",
    "delhi_hc": "delhihighcourt",
    "bombay_hc": "bombayhighcourt",
    "calcutta_hc": "calcuttahighcourt",
    "madras_hc": "madrashighcourt",
    "karnataka_hc": "karnatakaHighcourt",
    "kerala_hc": "keralahighcourt",
    "allahabad_hc": "allahabadhighcourt",
    "punjab_haryana_hc": "punjabhighcourt",
    "gujarat_hc": "gujarathighcourt",
    "rajasthan_hc": "rajasthanhighcourt",
    "telangana_hc": "telanganahighcourt",
    "andhra_hc": "andhrapradeshhighcourt",
    "jharkhand_hc": "jharkhandhighcourt",
    "chhattisgarh_hc": "chhattisgarhhighcourt",
    "uttarakhand_hc": "uttarakhandhighcourt",
    "himachal_hc": "himachalpradeshhighcourt",
    "orissa_hc": "orissahighcourt",
    "patna_hc": "patnahighcourt",
    "gauhati_hc": "gauhatihighcourt",
    "sikkim_hc": "sikkimhighcourt",
    "tripura_hc": "tripurahighcourt",
    "meghalaya_hc": "meghalayahighcourt",
    "manipur_hc": "manipurhighcourt",
    "jammu_kashmir_hc": "jammukashmirhighcourt"
}
