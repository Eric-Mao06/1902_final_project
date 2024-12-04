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

# Load environment variables
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    logger.error("GOOGLE_API_KEY not found in environment variables")
else:
    logger.debug("GOOGLE_API_KEY loaded successfully")

# Configure Gemini API
genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-1.5-flash-8b')

class TextGenerationRequest(BaseModel):
    query: str
    profile: dict

async def generate_text_stream(request: TextGenerationRequest):
    if not api_key:
        yield "Error: Google API key not configured.".encode('utf-8')
        return

    prompt = f"""
    Given a search query: "{request.query}"
    
    And a professional's profile:
    Name: {request.profile.get('name', 'N/A')}
    Role: {request.profile.get('role', 'N/A')}
    Company: {request.profile.get('company', 'N/A')}
    Summary: {request.profile.get('summary', 'N/A')}
    
    Explain in 2-3 sentences why this professional appeared in the search results and how their experience relates to the query.
    Be specific and highlight relevant aspects of their background.
    """

    try:
        response = await model.generate_content_async(prompt)
        text = response.text
        
        # Stream the response character by character
        for char in text:
            yield char.encode('utf-8')
            await asyncio.sleep(0.05)
    except Exception as e:
        error_msg = f"Error during text generation: {str(e)}"
        logger.error(error_msg)
        yield error_msg.encode('utf-8')

async def generate_text_handler(request: TextGenerationRequest):
    try:
        return StreamingResponse(
            generate_text_stream(request),
            media_type='text/plain'
        )
    except Exception as e:
        logger.error(f"Error during text generation handler: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
