"""
Lawyer Directory Service
========================
Connects users with verified lawyers for legal consultations and document reviews.

Features:
- Search lawyers by practice area and location
- Lawyer profiles with expertise and ratings
- Booking consultation slots
- Document review requests
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import logging
from dataclasses import dataclass, asdict
import uuid

logger = logging.getLogger(__name__)


class PracticeArea(str, Enum):
    """Legal practice areas."""
    CORPORATE = "Corporate Law"
    STARTUP = "Startup & Venture Capital"
    INTELLECTUAL_PROPERTY = "Intellectual Property"
    EMPLOYMENT = "Employment & Labour Law"
    TAX = "Tax Law"
    REAL_ESTATE = "Real Estate & Property"
    CONTRACTS = "Contract Law"
    LITIGATION = "Civil Litigation"
    CRIMINAL = "Criminal Law"
    FAMILY = "Family Law"
    BANKING_FINANCE = "Banking & Finance"
    INSOLVENCY = "Insolvency & Bankruptcy"
    COMPLIANCE = "Regulatory Compliance"
    DATA_PRIVACY = "Data Privacy & IT Law"
    ENVIRONMENT = "Environmental Law"
    ARBITRATION = "Arbitration & ADR"
    CONSUMER = "Consumer Protection"
    MEDIA = "Media & Entertainment"


class City(str, Enum):
    """Major Indian cities for lawyer search."""
    MUMBAI = "Mumbai"
    DELHI = "Delhi"
    BANGALORE = "Bangalore"
    CHENNAI = "Chennai"
    HYDERABAD = "Hyderabad"
    KOLKATA = "Kolkata"
    PUNE = "Pune"
    AHMEDABAD = "Ahmedabad"
    JAIPUR = "Jaipur"
    NOIDA = "Noida"
    GURUGRAM = "Gurugram"
    CHANDIGARH = "Chandigarh"
    KOCHI = "Kochi"
    LUCKNOW = "Lucknow"
    INDORE = "Indore"


@dataclass
class LawyerProfile:
    """Lawyer profile data."""
    id: str
    name: str
    email: str
    phone: str
    bar_council_id: str
    practice_areas: List[str]
    cities: List[str]
    experience_years: int
    education: List[str]
    languages: List[str]
    bio: str
    rating: float
    review_count: int
    hourly_rate: int  # INR
    consultation_fee: int  # INR for 30 min consultation
    document_review_rate: int  # INR per page
    is_verified: bool
    is_available: bool
    profile_image: Optional[str] = None
    firm_name: Optional[str] = None
    notable_cases: Optional[List[str]] = None
    certifications: Optional[List[str]] = None
    created_at: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class ConsultationBooking:
    """Consultation booking data."""
    id: str
    lawyer_id: str
    client_id: str
    client_name: str
    client_email: str
    client_phone: str
    practice_area: str
    description: str
    preferred_date: str
    preferred_time: str
    duration_minutes: int
    status: str  # pending, confirmed, completed, cancelled
    amount: int
    created_at: str
    notes: Optional[str] = None


@dataclass
class DocumentReviewRequest:
    """Document review request data."""
    id: str
    lawyer_id: str
    client_id: str
    document_type: str
    page_count: int
    description: str
    urgency: str  # standard, urgent, express
    status: str  # pending, in_review, completed, cancelled
    amount: int
    created_at: str
    deadline: Optional[str] = None


class LawyerDirectoryService:
    """
    Service for managing lawyer directory and consultations.

    In production, this would connect to:
    - Vakilsearch API (https://vakilsearch.com)
    - LegalKart API (https://legalkart.com)
    - Custom lawyer database

    For now, provides demo data and structure for integration.
    """

    def __init__(self):
        # Demo lawyer profiles
        self._lawyers = self._create_demo_lawyers()
        self._bookings: Dict[str, ConsultationBooking] = {}
        self._reviews: Dict[str, DocumentReviewRequest] = {}

    def _create_demo_lawyers(self) -> Dict[str, LawyerProfile]:
        """Create demo lawyer profiles."""
        lawyers = [
            LawyerProfile(
                id="LAW001",
                name="Adv. Priya Sharma",
                email="priya.sharma@lawfirm.in",
                phone="+91-98765-43210",
                bar_council_id="D/1234/2015",
                practice_areas=["Corporate Law", "Startup & Venture Capital", "Contract Law"],
                cities=["Delhi", "Gurugram", "Noida"],
                experience_years=9,
                education=["B.A. LL.B. (Hons), National Law University Delhi", "LL.M. Corporate Law, Harvard Law School"],
                languages=["English", "Hindi"],
                bio="Specializing in startup law with experience in 200+ funding rounds. Former associate at Cyril Amarchand Mangaldas. Expert in ESOP structuring, SHA negotiations, and regulatory compliance for tech startups.",
                rating=4.9,
                review_count=156,
                hourly_rate=8000,
                consultation_fee=2500,
                document_review_rate=500,
                is_verified=True,
                is_available=True,
                firm_name="Sharma & Associates",
                notable_cases=["Series B funding for Unicorn startup", "Cross-border M&A advisory"],
                certifications=["Certified Information Privacy Professional (CIPP/E)"]
            ),
            LawyerProfile(
                id="LAW002",
                name="Adv. Rajesh Kumar Verma",
                email="rajesh.verma@chambers.in",
                phone="+91-98111-22334",
                bar_council_id="BCI/DEL/5678/2008",
                practice_areas=["Tax Law", "Corporate Law", "Insolvency & Bankruptcy"],
                cities=["Delhi", "Mumbai"],
                experience_years=16,
                education=["B.Com., LL.B., Delhi University", "Chartered Accountant (ICAI)", "LL.M. Taxation, London School of Economics"],
                languages=["English", "Hindi", "Punjabi"],
                bio="Expert in corporate taxation, transfer pricing, and GST matters. Represented clients before ITAT, High Courts, and Supreme Court. Special expertise in startup tax structuring and angel tax issues.",
                rating=4.8,
                review_count=312,
                hourly_rate=12000,
                consultation_fee=4000,
                document_review_rate=750,
                is_verified=True,
                is_available=True,
                firm_name="Verma Tax Chambers",
                notable_cases=["Landmark angel tax relief case", "₹500 Cr transfer pricing dispute resolution"],
                certifications=["Chartered Accountant", "Insolvency Professional (IBBI)"]
            ),
            LawyerProfile(
                id="LAW003",
                name="Adv. Meera Nair",
                email="meera.nair@iplaw.in",
                phone="+91-80-4567-8900",
                bar_council_id="KAR/2345/2012",
                practice_areas=["Intellectual Property", "Data Privacy & IT Law", "Media & Entertainment"],
                cities=["Bangalore", "Chennai", "Hyderabad"],
                experience_years=12,
                education=["B.Tech, IIT Madras", "LL.B., NLSIU Bangalore", "LL.M. IP Law, Stanford University"],
                languages=["English", "Hindi", "Tamil", "Malayalam"],
                bio="Tech-lawyer with engineering background. Expertise in patent prosecution, trademark protection, and tech licensing. Helped 50+ startups secure IP portfolios. Expert witness in tech disputes.",
                rating=4.9,
                review_count=189,
                hourly_rate=10000,
                consultation_fee=3500,
                document_review_rate=600,
                is_verified=True,
                is_available=True,
                firm_name="Nair IP Associates",
                notable_cases=["Patent infringement case against MNC", "Landmark software copyright ruling"],
                certifications=["Indian Patent Agent", "WIPO Accredited"]
            ),
            LawyerProfile(
                id="LAW004",
                name="Adv. Arjun Mehta",
                email="arjun.mehta@litigation.in",
                phone="+91-22-6789-0123",
                bar_council_id="MAH/6789/2010",
                practice_areas=["Civil Litigation", "Arbitration & ADR", "Real Estate & Property"],
                cities=["Mumbai", "Pune"],
                experience_years=14,
                education=["B.A. LL.B. (Hons), Government Law College Mumbai", "Diploma in Arbitration, NLSIU"],
                languages=["English", "Hindi", "Marathi", "Gujarati"],
                bio="Senior litigation counsel with extensive experience in Bombay High Court and Supreme Court. Specializes in commercial disputes, real estate litigation, and arbitration. Over 500 cases argued.",
                rating=4.7,
                review_count=267,
                hourly_rate=15000,
                consultation_fee=5000,
                document_review_rate=800,
                is_verified=True,
                is_available=True,
                firm_name="Mehta Litigation Chambers",
                notable_cases=["RERA landmark judgment", "₹200 Cr commercial arbitration"],
                certifications=["Empaneled Arbitrator - MCIA", "Senior Advocate"]
            ),
            LawyerProfile(
                id="LAW005",
                name="Adv. Sneha Banerjee",
                email="sneha.banerjee@compliance.in",
                phone="+91-33-4567-8901",
                bar_council_id="WB/8901/2014",
                practice_areas=["Regulatory Compliance", "Employment & Labour Law", "Consumer Protection"],
                cities=["Kolkata", "Delhi", "Mumbai"],
                experience_years=10,
                education=["B.A. LL.B., NUJS Kolkata", "LL.M. Labour Law, Warwick University"],
                languages=["English", "Hindi", "Bengali"],
                bio="Compliance specialist helping companies navigate Indian regulatory landscape. Expert in labor law compliance, POSH implementation, and consumer protection matters. Advised 100+ companies on HR policies.",
                rating=4.8,
                review_count=134,
                hourly_rate=7000,
                consultation_fee=2000,
                document_review_rate=400,
                is_verified=True,
                is_available=True,
                firm_name="Banerjee Compliance Advisory",
                notable_cases=["Major workplace harassment policy overhaul", "Factory compliance for MNC"],
                certifications=["Certified POSH Trainer", "Labour Law Specialist"]
            ),
            LawyerProfile(
                id="LAW006",
                name="Adv. Vikram Singh",
                email="vikram.singh@corporate.in",
                phone="+91-124-456-7890",
                bar_council_id="D/3456/2006",
                practice_areas=["Corporate Law", "Banking & Finance", "Insolvency & Bankruptcy"],
                cities=["Gurugram", "Delhi", "Mumbai"],
                experience_years=18,
                education=["B.Com., LL.B., Delhi University", "LL.M. Banking & Finance, King's College London"],
                languages=["English", "Hindi"],
                bio="Partner at tier-1 law firm. Expertise in M&A, PE/VC transactions, and debt restructuring. Led transactions worth ₹50,000+ Cr. Board advisor to multiple listed companies.",
                rating=4.9,
                review_count=98,
                hourly_rate=25000,
                consultation_fee=10000,
                document_review_rate=1500,
                is_verified=True,
                is_available=True,
                firm_name="Singh & Partners",
                notable_cases=["₹10,000 Cr M&A deal", "Restructuring of major NBFC"],
                certifications=["Insolvency Professional", "SEBI Empaneled"]
            ),
            LawyerProfile(
                id="LAW007",
                name="Adv. Ananya Krishnan",
                email="ananya.krishnan@startuplaw.in",
                phone="+91-98450-12345",
                bar_council_id="KAR/7890/2016",
                practice_areas=["Startup & Venture Capital", "Contract Law", "Data Privacy & IT Law"],
                cities=["Bangalore", "Hyderabad"],
                experience_years=8,
                education=["B.A. LL.B. (Hons), NLSIU Bangalore", "Certificate in Fintech Law, MIT"],
                languages=["English", "Hindi", "Kannada", "Telugu"],
                bio="Dedicated startup lawyer helping founders from ideation to exit. Expertise in term sheets, ESOPs, privacy compliance, and fintech regulations. Ecosystem builder and mentor at multiple accelerators.",
                rating=4.9,
                review_count=223,
                hourly_rate=6000,
                consultation_fee=1500,
                document_review_rate=350,
                is_verified=True,
                is_available=True,
                firm_name="Startup Legal Co.",
                notable_cases=["100+ startup incorporations", "DPIIT Startup India policy input"],
                certifications=["CIPP/E", "Startup India Mentor"]
            ),
            LawyerProfile(
                id="LAW008",
                name="Adv. Mohammed Farooq",
                email="farooq@disputes.in",
                phone="+91-40-6789-0123",
                bar_council_id="AP/4567/2011",
                practice_areas=["Civil Litigation", "Criminal Law", "Family Law"],
                cities=["Hyderabad", "Chennai"],
                experience_years=13,
                education=["B.A. LL.B., Osmania University", "LL.M. Criminal Law, NALSAR"],
                languages=["English", "Hindi", "Telugu", "Urdu"],
                bio="Experienced litigator handling civil and criminal matters. Special expertise in white collar crimes, matrimonial disputes, and property litigation. Appeared in 300+ cases across trial courts and High Court.",
                rating=4.6,
                review_count=178,
                hourly_rate=5000,
                consultation_fee=1500,
                document_review_rate=300,
                is_verified=True,
                is_available=True,
                notable_cases=["High-profile fraud investigation", "Complex succession dispute"]
            ),
            LawyerProfile(
                id="LAW009",
                name="Adv. Deepika Joshi",
                email="deepika.joshi@envirolaw.in",
                phone="+91-79-5678-9012",
                bar_council_id="GUJ/2345/2013",
                practice_areas=["Environmental Law", "Real Estate & Property", "Regulatory Compliance"],
                cities=["Ahmedabad", "Mumbai", "Delhi"],
                experience_years=11,
                education=["B.Sc., LL.B., Gujarat University", "LL.M. Environmental Law, CEERA NLSIU"],
                languages=["English", "Hindi", "Gujarati"],
                bio="Environmental law specialist with expertise in pollution control, EIA clearances, and green compliance. Advises manufacturing units on environmental permits. Expert in RERA matters.",
                rating=4.7,
                review_count=89,
                hourly_rate=6500,
                consultation_fee=2000,
                document_review_rate=450,
                is_verified=True,
                is_available=True,
                firm_name="Green Law Associates",
                notable_cases=["Environmental clearance for major project", "NGT representation"],
                certifications=["Environmental Auditor", "RERA Expert"]
            ),
            LawyerProfile(
                id="LAW010",
                name="Adv. Kartik Venkataraman",
                email="kartik@arbitration.in",
                phone="+91-44-3456-7890",
                bar_council_id="TN/5678/2009",
                practice_areas=["Arbitration & ADR", "Contract Law", "Corporate Law"],
                cities=["Chennai", "Bangalore", "Mumbai"],
                experience_years=15,
                education=["B.A. LL.B., Madras Law College", "LL.M. International Arbitration, Queen Mary University"],
                languages=["English", "Hindi", "Tamil"],
                bio="International arbitration practitioner. Expertise in commercial arbitration, construction disputes, and investment treaty arbitration. Regularly appears as counsel and arbitrator in ICC, SIAC, and LCIA proceedings.",
                rating=4.9,
                review_count=67,
                hourly_rate=18000,
                consultation_fee=6000,
                document_review_rate=1000,
                is_verified=True,
                is_available=True,
                firm_name="Venkataraman Arbitration Chambers",
                notable_cases=["$50M investment arbitration", "Cross-border JV dispute"],
                certifications=["FCIArb", "SIAC Panel Arbitrator"]
            )
        ]

        return {lawyer.id: lawyer for lawyer in lawyers}

    async def search_lawyers(
        self,
        practice_area: Optional[str] = None,
        city: Optional[str] = None,
        min_experience: int = 0,
        max_hourly_rate: Optional[int] = None,
        min_rating: float = 0.0,
        is_available: bool = True,
        sort_by: str = "rating",  # rating, experience, price
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Search for lawyers by criteria.

        Args:
            practice_area: Filter by practice area
            city: Filter by city
            min_experience: Minimum years of experience
            max_hourly_rate: Maximum hourly rate in INR
            min_rating: Minimum rating (0-5)
            is_available: Only show available lawyers
            sort_by: Sort results by field
            limit: Number of results to return
            offset: Pagination offset

        Returns:
            Dict with lawyers list and metadata
        """
        results = list(self._lawyers.values())

        # Apply filters
        if practice_area:
            results = [l for l in results if practice_area in l.practice_areas]
        if city:
            results = [l for l in results if city in l.cities]
        if min_experience > 0:
            results = [l for l in results if l.experience_years >= min_experience]
        if max_hourly_rate:
            results = [l for l in results if l.hourly_rate <= max_hourly_rate]
        if min_rating > 0:
            results = [l for l in results if l.rating >= min_rating]
        if is_available:
            results = [l for l in results if l.is_available]

        # Sort
        if sort_by == "rating":
            results.sort(key=lambda l: l.rating, reverse=True)
        elif sort_by == "experience":
            results.sort(key=lambda l: l.experience_years, reverse=True)
        elif sort_by == "price":
            results.sort(key=lambda l: l.hourly_rate)

        total = len(results)
        results = results[offset:offset + limit]

        return {
            "lawyers": [l.to_dict() for l in results],
            "total": total,
            "limit": limit,
            "offset": offset,
            "filters_applied": {
                "practice_area": practice_area,
                "city": city,
                "min_experience": min_experience,
                "max_hourly_rate": max_hourly_rate,
                "min_rating": min_rating
            }
        }

    async def get_lawyer(self, lawyer_id: str) -> Optional[Dict[str, Any]]:
        """Get lawyer profile by ID."""
        lawyer = self._lawyers.get(lawyer_id)
        if lawyer:
            return lawyer.to_dict()
        return None

    async def book_consultation(
        self,
        lawyer_id: str,
        client_id: str,
        client_name: str,
        client_email: str,
        client_phone: str,
        practice_area: str,
        description: str,
        preferred_date: str,
        preferred_time: str,
        duration_minutes: int = 30
    ) -> Dict[str, Any]:
        """
        Book a consultation with a lawyer.

        Returns:
            Booking confirmation with details
        """
        lawyer = self._lawyers.get(lawyer_id)
        if not lawyer:
            return {"error": "Lawyer not found"}
        if not lawyer.is_available:
            return {"error": "Lawyer is not available"}

        # Calculate amount
        amount = lawyer.consultation_fee
        if duration_minutes > 30:
            extra_time = duration_minutes - 30
            amount += int((extra_time / 60) * lawyer.hourly_rate)

        booking = ConsultationBooking(
            id=f"BOOK-{uuid.uuid4().hex[:8].upper()}",
            lawyer_id=lawyer_id,
            client_id=client_id,
            client_name=client_name,
            client_email=client_email,
            client_phone=client_phone,
            practice_area=practice_area,
            description=description,
            preferred_date=preferred_date,
            preferred_time=preferred_time,
            duration_minutes=duration_minutes,
            status="pending",
            amount=amount,
            created_at=datetime.now().isoformat()
        )

        self._bookings[booking.id] = booking

        return {
            "booking_id": booking.id,
            "status": "pending",
            "lawyer": {
                "name": lawyer.name,
                "email": lawyer.email
            },
            "schedule": {
                "date": preferred_date,
                "time": preferred_time,
                "duration_minutes": duration_minutes
            },
            "amount": amount,
            "message": "Booking request submitted. The lawyer will confirm shortly."
        }

    async def request_document_review(
        self,
        lawyer_id: str,
        client_id: str,
        document_type: str,
        page_count: int,
        description: str,
        urgency: str = "standard"
    ) -> Dict[str, Any]:
        """
        Request document review from a lawyer.

        Args:
            lawyer_id: Lawyer ID
            client_id: Client user ID
            document_type: Type of document (NDA, Agreement, etc.)
            page_count: Number of pages
            description: Description of review needed
            urgency: standard (3-5 days), urgent (1-2 days), express (24 hours)

        Returns:
            Review request confirmation
        """
        lawyer = self._lawyers.get(lawyer_id)
        if not lawyer:
            return {"error": "Lawyer not found"}

        # Calculate amount based on pages and urgency
        base_amount = page_count * lawyer.document_review_rate
        urgency_multiplier = {"standard": 1.0, "urgent": 1.5, "express": 2.0}
        amount = int(base_amount * urgency_multiplier.get(urgency, 1.0))

        # Calculate deadline
        days = {"standard": 5, "urgent": 2, "express": 1}
        deadline = (datetime.now() + timedelta(days=days.get(urgency, 5))).isoformat()

        review = DocumentReviewRequest(
            id=f"REV-{uuid.uuid4().hex[:8].upper()}",
            lawyer_id=lawyer_id,
            client_id=client_id,
            document_type=document_type,
            page_count=page_count,
            description=description,
            urgency=urgency,
            status="pending",
            amount=amount,
            created_at=datetime.now().isoformat(),
            deadline=deadline
        )

        self._reviews[review.id] = review

        return {
            "review_id": review.id,
            "status": "pending",
            "lawyer": {
                "name": lawyer.name,
                "email": lawyer.email
            },
            "document": {
                "type": document_type,
                "pages": page_count,
                "urgency": urgency
            },
            "amount": amount,
            "deadline": deadline,
            "message": "Document review request submitted."
        }

    def get_practice_areas(self) -> List[str]:
        """Get list of all practice areas."""
        return [area.value for area in PracticeArea]

    def get_cities(self) -> List[str]:
        """Get list of supported cities."""
        return [city.value for city in City]


# Singleton instance
_lawyer_service: Optional[LawyerDirectoryService] = None


def get_lawyer_service() -> LawyerDirectoryService:
    """Get or create lawyer directory service instance."""
    global _lawyer_service
    if _lawyer_service is None:
        _lawyer_service = LawyerDirectoryService()
    return _lawyer_service
