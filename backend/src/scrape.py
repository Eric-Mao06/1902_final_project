from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import requests
import os

url = "https://api.scrapin.io/enrichment/profile"
api_key = os.getenv("SCRAPIN_API_KEY")
querystring = {
    "apikey": api_key,
    "linkedInUrl": "https://www.linkedin.com/in/eric-mao/"
}

response = requests.request("GET", url, params=querystring)

print(response.text)


