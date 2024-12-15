import os
from dotenv import load_dotenv
from cerebras.cloud.sdk import Cerebras
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
api_key = os.getenv("CEREBRAS_API_KEY")
if not api_key:
    logger.error("CEREBRAS_API_KEY not found in environment variables")
else:
    logger.debug("CEREBRAS_API_KEY loaded successfully")

# Configure Cerebras client
client = Cerebras(api_key=api_key)

class TextGenerationRequest(BaseModel):
    query: str
    profile: dict

async def generate_text_for_profile(query: str, profile: dict) -> str:
    if not api_key:
        return "Error: Cerebras API key not configured."

    prompt = f"""
    Given a search query: "{query}"
    
    And a professional's profile:
    Name: {profile.get('name', 'N/A')}
    Role: {profile.get('role', 'N/A')}
    Company: {profile.get('company', 'N/A')}
    Summary: {profile.get('summary', 'N/A')}
    
    Explain in 2-3 sentences why this professional appeared in the search results and how their experience relates to the query.
    Be specific and highlight relevant aspects of their background.
    """

    try:
        response = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": prompt
                }
            ],
            model="llama3.1-8b",
            stream=False,
            max_completion_tokens=256,  # Reduced from 1024 since we only need 2-3 sentences
            temperature=0.2,
            top_p=1
        )
        return response.choices[0].message.content
            
    except Exception as e:
        error_msg = f"Error during text generation: {str(e)}"
        logger.error(error_msg)
        return error_msg

async def generate_explanations_parallel(query: str, profiles: list) -> list:
    """Generate explanations for multiple profiles in parallel"""
    tasks = [generate_text_for_profile(query, profile) for profile in profiles]
    explanations = await asyncio.gather(*tasks)
    return explanations

# Keep the old function for backward compatibility
async def generate_text_stream(request: TextGenerationRequest):
    explanation = await generate_text_for_profile(request.query, request.profile)
    yield explanation.encode('utf-8')

async def generate_text_handler(request: TextGenerationRequest):
    try:
        return StreamingResponse(
            generate_text_stream(request),
            media_type='text/plain'
        )
    except Exception as e:
        logger.error(f"Error during text generation handler: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
