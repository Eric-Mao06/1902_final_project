import os
from dotenv import load_dotenv
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import asyncio
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class TextGenerationRequest(BaseModel):
    query: str
    profile: dict

def create_prompt(request: TextGenerationRequest) -> str:
    return f"""
    Given a search query: "{request.query}"
    
    And a professional's profile:
    Name: {request.profile.get('name', 'N/A')}
    Role: {request.profile.get('role', 'N/A')}
    Company: {request.profile.get('company', 'N/A')}
    Summary: {request.profile.get('summary', 'N/A')}
    
    Explain in 2-3 sentences why this professional appeared in the search results and how their experience relates to the query.
    Be specific and highlight relevant aspects of their background.
    """

def generate_text_handler(request: TextGenerationRequest):
    prompt = create_prompt(request)
    return StreamingResponse(
        content=prompt.encode('utf-8'),
        media_type="text/event-stream"
    )
