"""
eMigr8 Policy Guardrail & Hallucination Detector
Verifies Dr. Zenith AI responses against statutory immigration criteria
(UK Tech Nation, US O-1A/EB-1A, Canada SUV) before delivery to applicants.
"""

import re
from typing import Tuple, Optional


class PolicyGuardrail:
    """
    Scans AI-generated draft messages to identify common legal or procedural errors
    that could mislead a candidate or jeopardize their visa petition.
    """

    @classmethod
    def validate_visa_response(cls, text: str) -> Tuple[bool, float, Optional[str]]:
        """
        Validates text against key statutory criteria.
        Returns:
            (is_compliant: bool, accuracy_score: float, warning_reason: Optional[str])
        """
        lower = text.lower()

        # Rule 1: UK Tech Nation Reference Letters Rule
        # Tech Nation guidelines strictly enforce EXACTLY 3 letters of recommendation.
        if "tech nation" in lower or "global talent" in lower:
            # Check for suggestions of 4, 5, or more reference letters
            if re.search(r'\b(4|5|6|7|8)\s+(to\s+\d+\s+)?letters?\s+of\s+recommendation', lower) or \
               re.search(r'submit\s+between\s+(3|4)\s+to\s+(4|5|6)\s+letters', lower):
                return (
                    False,
                    35.0,
                    "CRITICAL INACCURACY: Tech Nation statutory policy strictly mandates EXACTLY 3 letters of recommendation. Submitting 4 or more leads to invalidation or rejected extra letters."
                )

            # Check for suggestions of uncorroborated evidence or self-declarations
            if "self-declaration" in lower and ("sufficient" in lower or "enough" in lower or "valid" in lower):
                return (
                    False,
                    30.0,
                    "FLAGGED BY POLICY ENGINE: Tech Nation explicitly rejects uncorroborated self-declarations or internal slides without objective third-party proof."
                )

            # Check for evidence limit > 10
            if re.search(r'submit\s+(1[1-9]|[2-9]\d)\s+(pieces|documents|evidence)', lower):
                return (
                    False,
                    40.0,
                    "PROCEDURAL VIOLATION: Tech Nation has a strict ceiling of 10 evidence pieces. Additional items will be discarded unread."
                )

        # Rule 2: US O-1A Venture Capital / SAFE notes
        # USCIS accepts institutional SAFE rounds and cap table valuations under Critical Role / High Remuneration.
        if ("o-1" in lower or "o1" in lower or "eb-1" in lower) and "safe" in lower:
            if "cannot be used" in lower or "only looks at w2" in lower or "w-2 only" in lower:
                return (
                    False,
                    42.0,
                    "MISLEADING POLICY: USCIS updated policy allows venture-backed founders to show significant equity valuation and institutional SAFE rounds under Critical Role and High Remuneration."
                )

        # Rule 3: Canada SUV Minimums
        if "startup visa" in lower or "suv" in lower:
            if "angel" in lower and re.search(r'\$([0-9]{1,2}|[1-6][0-9])k', lower):
                return (
                    False,
                    45.0,
                    "INCORRECT COMMITMENT: Designated Angel investor groups in Canada require a minimum $75,000 CAD commitment."
                )

        # Compliant / High Confidence
        return (True, 96.0, None)
