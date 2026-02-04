from openai import OpenAI
from app.config import settings
from typing import Dict, List
from decimal import Decimal

client = OpenAI(api_key=settings.openai_api_key)


def generate_founder_agreement(
    company_name: str,
    company_description: str,
    company_state: str,
    authorized_capital: Decimal,
    founders: List[Dict],
    preferences: Dict,
) -> str:
    """
    Generate Founder Agreement document using GPT-4
    Returns markdown formatted document
    """
    
    # Build founders information
    founders_text = "\n".join([
        f"- {f['name']} ({f['role']}): {f['equity_percentage']}% equity, "
        f"{f['vesting_months']} months vesting with {f['cliff_months']} month cliff"
        for f in founders
    ])
    
    # Build prompt
    system_prompt = """You are an experienced Indian corporate lawyer specializing in startup agreements. 
Generate a comprehensive Founder Agreement document that complies with the Indian Companies Act, 2013.
The document must be professional, legally sound, and suitable for lawyer review.
Use proper legal terminology and structure."""

    user_prompt = f"""Generate a Founder Agreement for the following company:

COMPANY DETAILS:
- Name: {company_name}
- Description: {company_description}
- State of Incorporation: {company_state}
- Authorized Capital: ₹{authorized_capital}

FOUNDERS:
{founders_text}

LEGAL PREFERENCES:
- Non-compete clause: {'Yes' if preferences.get('non_compete') else 'No'}
- Non-compete period: {preferences.get('non_compete_months', 12)} months
- Dispute Resolution: {preferences.get('dispute_resolution', 'arbitration')}
- Governing Law: India
- Additional Terms: {preferences.get('additional_terms', 'None')}

DOCUMENT REQUIREMENTS:
1. Include proper preamble with date and parties
2. Define equity distribution clearly
3. Specify vesting schedule with cliff period
4. Include roles and responsibilities section
5. Add non-compete clause if requested
6. Include dispute resolution mechanism
7. Specify governing law as India
8. Add signature section for all founders
9. Use numbered sections and subsections
10. Ensure compliance with Indian legal standards

Format the output as markdown with proper headings, sections, and formatting.
Make it ready for conversion to Word document."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,  # Lower temperature for more consistent legal language
            max_tokens=4000,
        )
        
        return response.choices[0].message.content
    except Exception as e:
        raise Exception(f"Failed to generate document: {str(e)}")
