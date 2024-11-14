from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from pydantic import BaseModel
from dotenv import load_dotenv
import requests
import os
import json
import re

url = "https://api.scrapin.io/enrichment/profile"
api_key = os.getenv("SCRAPIN_API_KEY")

class LinkedInProfile(BaseModel):
    data: dict

profiles: list[LinkedInProfile] = []
    
def get_linkedin(linkedInUrl: str):
    querystring = {
        "apikey": api_key,
        "linkedInUrl": linkedInUrl
    }

    response = requests.request("GET", url, params=querystring)
    response_dict = json.loads(response.text)
    new_dict = {'person': response_dict.get('person'), 'company': response_dict.get('company')}
    return new_dict

def save_profiles():
    global profiles
    with open("data.json", "w") as file:
        dump = [profile.model_dump() for profile in profiles]
        file.write(json.dumps(dump, indent=4))

app = FastAPI()

@app.post("/linkedin-profile")
async def get_linkedin_profile(linkedInUrl: str):
    
    linkedInUrlRegex = re.compile(r"^https://www\.linkedin\.com/in/[\w-]+/?$")
    if not linkedInUrlRegex.match(linkedInUrl):
        raise HTTPException(status_code=400, detail="Invalid LinkedIn URL format")
    
    data = get_linkedin(linkedInUrl)
    profile = LinkedInProfile(data=data)
    profiles.append(profile)

    save_profiles()
    
    return profile


@app.get("/linkedin-profiles")
async def get_all_linkedin_profiles():
    
    return profiles
