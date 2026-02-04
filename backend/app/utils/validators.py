from decimal import Decimal
from typing import List
from app.schemas.founder import FounderCreate


def validate_equity_sum(founders: List[FounderCreate]) -> bool:
    """Validate that total equity percentage equals 100%"""
    total = sum(founder.equity_percentage for founder in founders)
    return abs(float(total) - 100.0) < 0.01  # Allow small floating point errors


def validate_founder_count(founders: List[FounderCreate]) -> bool:
    """Validate that there are 2-4 founders"""
    return 2 <= len(founders) <= 4
