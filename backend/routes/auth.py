from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
import requests
import os
from google import generativeai
from models.user import User
import voyageai
from dependencies import get_db

router = APIRouter()

# Initialize Gemini
generativeai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = generativeai.GenerativeModel('gemini-pro')
# Initialize VoyageAI
voyageai.api_key = os.getenv("VOYAGE_API_KEY")

@router.post("/linkedin-scrape")
async def scrape_linkedin_profile(data: Dict[str, str]):
    try:
        linkedin_url = data.get("linkedinUrl")
        if not linkedin_url:
            raise HTTPException(status_code=400, detail="LinkedIn URL is required")
        
        print(f"Attempting to scrape LinkedIn URL: {linkedin_url}")
        
        # Use scrapin.io API
        url = "https://api.scrapin.io/enrichment/profile"
        querystring = {
            "apikey": os.getenv("SCRAPIN_API_KEY"),
            "linkedInUrl": linkedin_url
        }
        
        print(f"Making request to scrapin.io with API key: {os.getenv('SCRAPIN_API_KEY')[:5]}...")
        print(f"Query parameters: {querystring}")
        response = requests.get(url, params=querystring)
        
        if response.status_code != 200:
            print(f"Scrapin.io error: Status {response.status_code}, Response: {response.text}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"LinkedIn scraping failed: {response.text}"
            )
        
        profile_data = response.json()
        raw_profile = str(profile_data)
        print(f"Successfully scraped profile data length: {len(raw_profile)}")
        
        if not profile_data or "error" in profile_data:
            error_msg = profile_data.get("error", "Unknown error") if profile_data else "Empty response"
            raise HTTPException(status_code=400, detail=f"LinkedIn scraping failed: {error_msg}")
        
        # Generate summary using Gemini
        prompt = f"""
Analyze this LinkedIn profile comprehensively and extract detailed professional information. Generate rich semantic content that captures the person's complete professional identity. The summary should be around 400 words. Format it as one paragraph don't use markdown.
    
    Focus on extracting and synthesizing:
    
    PROFESSIONAL IDENTITY:
    - Career trajectory and progression
    - Industry specializations and domain expertise
    - Leadership and management experience
    - Professional achievements and impact
    - Core competencies and technical skills
    
    DOMAIN KNOWLEDGE:
    - Technical expertise and tools
    - Industry-specific knowledge
    - Methodologies and frameworks
    - Certifications and qualifications
    
    IMPACT & ACHIEVEMENTS:
    - Quantifiable results and metrics
    - Project outcomes and deliverables
    - Awards and recognition
    - Business value created
        Raw Profile Data:
        {raw_profile}
        """
        
        print("Generating summary with Gemini...")
        response = model.generate_content(prompt)
        summary = response.text
        
        # Extract basic profile info
        person = profile_data.get("person", {})
        location = person.get("location", "")
        company = person.get("currentCompanyName", "")
        if not company and person.get("experience"):
            company = person["experience"][0].get("companyName", "")
        
        role = person.get("headline", "")
        if not role and person.get("experience"):
            role = person["experience"][0].get("title", "")

        photo_url = person.get("photoUrl", "")
        
        return {
            "location": location,
            "company": company,
            "role": role,
            "summary": summary,
            "photoUrl": photo_url,
            "raw_data": profile_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in scrape_linkedin_profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to scrape LinkedIn profile: {str(e)}")

@router.post("/complete-signup")
async def complete_signup(
    user_data: Dict[str, Any],
    db = Depends(get_db)
):
    try:
        # Create user model instance
        user_model = User(db)
        
        # Check if user with LinkedIn URL already exists
        existing_user = await user_model.get_user_by_linkedin_url(user_data["linkedinUrl"])
        if existing_user:
            raise HTTPException(status_code=400, detail="User with this LinkedIn URL already exists")
        
        # Generate embedding for the summary using voyage-3 model
        embedding = voyageai.get_embedding(
            user_data["summary"],
            model="voyage-3"
        )
        
        # Create user in database
        user_id = await user_model.create_user(
            user_data=user_data,
            raw_linkedin_data=user_data.get("raw_data", {}),
            embedding=embedding
        )
        
        return {"userId": user_id}
    except HTTPException:
        raise
    except Exception as e:
        # Log the error and raise a generic server error
        print(f"Error in complete_signup: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during signup")
