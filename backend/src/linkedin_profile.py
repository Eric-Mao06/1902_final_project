import os
import uuid
from datetime import datetime, timedelta
import requests
from fastapi import HTTPException
from google import generativeai
import voyageai
import logging

logger = logging.getLogger(__name__)

# Initialize Gemini
generativeai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = generativeai.GenerativeModel('gemini-1.5-pro')

# Initialize VoyageAI
voyage_api_key = os.getenv("VOYAGE_API_KEY")
if not voyage_api_key:
    raise ValueError("VOYAGE_API_KEY environment variable is not set")
voyageai.api_key = voyage_api_key

# Temporary storage for LinkedIn data with TTL
linkedin_data_store = {}

def cleanup_old_data():
    current_time = datetime.now()
    expired_keys = [
        key for key, value in linkedin_data_store.items()
        if current_time - value['timestamp'] > timedelta(hours=1)
    ]
    for key in expired_keys:
        del linkedin_data_store[key]

async def scrape_linkedin_profile(linkedin_url: str):
    try:
        if not linkedin_url:
            raise HTTPException(status_code=400, detail="LinkedIn URL is required")
        
        print(f"Attempting to scrape LinkedIn URL: {linkedin_url}")
        
        # Use RapidAPI LinkedIn API
        url = "https://linkedin-api8.p.rapidapi.com/get-profile-data-by-url"
        api_key = os.getenv("RAPIDAPI_KEY")
        if not api_key:
            print("RAPIDAPI_KEY environment variable is not set")
            raise HTTPException(status_code=500, detail="API key configuration error")
            
        headers = {
            "x-rapidapi-key": api_key,
            "x-rapidapi-host": "linkedin-api8.p.rapidapi.com"
        }
        querystring = {"url": linkedin_url}
        
        response = requests.get(url, headers=headers, params=querystring)
        
        if response.status_code != 200:
            print(f"RapidAPI LinkedIn error: Status {response.status_code}, Response: {response.text}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"LinkedIn scraping failed: {response.text}"
            )
        
        profile_data = response.json()
        raw_profile = str(profile_data)
        print(f"Successfully scraped profile data length: {len(raw_profile)}")
        
        if not profile_data:
            raise HTTPException(status_code=400, detail="LinkedIn scraping failed: Empty response")
        
        # Extract profile information
        location = f"{profile_data.get('geo', {}).get('city', '')}, {profile_data.get('geo', {}).get('country', '')}"
        positions = profile_data.get('position', [])
        current_position = positions[0] if positions else {}
        company = current_position.get('companyName', '')
        role = profile_data.get('headline', '')
        photo_url = profile_data.get('profilePicture', '')
        name = profile_data.get('fullName', '')
        
        # Generate summary using Gemini
        prompt = f"""
You are an AI assistant that specializes in generating concise professional summaries for a knowledge database. You will be given raw JSON data containing a person's LinkedIn profile information. Your goal is to:

Parse the JSON carefully to extract the most relevant details (e.g., name, education, positions, key accomplishments, honors).
Produce a single-paragraph summary that is succinct, factual, and professional.
Avoid including personal contact details, links, or any extraneous information (e.g., email addresses).
Focus on the individual's academic background, professional experience, notable projects, and honors.
Write in the third person, using a neutral, professional tone.
Ensure the paragraph is 300 words.
Do not output anything other than this single-paragraph summary. Do not format the text with markdown. If data is missing or not relevant, simply omit it. If there is no data at all, return an empty string.

Here is the raw JSON (do not summarize this instruction text, only the JSON content below):
        {raw_profile}
        """
        
        print("Generating summary with Gemini...")
        response = model.generate_content(prompt)
        summary = response.text
        
        # Generate a unique ID for this data
        data_id = str(uuid.uuid4())
        
        # Store the full data with timestamp
        linkedin_data_store[data_id] = {
            'data': profile_data,
            'timestamp': datetime.now(),
            'location': location,
            'company': company,
            'role': role,
            'summary': summary,
            'photoUrl': photo_url,
            'name': name
        }
        
        # Clean up old data
        cleanup_old_data()
        
        return {
            "location": location,
            "company": company,
            "role": role,
            "summary": summary,
            "photoUrl": photo_url,
            "name": name,
            "dataId": data_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in scrape_linkedin_profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to scrape LinkedIn profile: {str(e)}")

def get_stored_linkedin_data(data_id: str):
    cleanup_old_data()
    stored_data = linkedin_data_store.get(data_id)
    if not stored_data:
        raise HTTPException(status_code=404, detail="LinkedIn data not found or expired")
    return stored_data['data'] 