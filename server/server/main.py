import os
import json
import base64
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from twilio.rest import Client
import httpx
import websockets
from urllib.parse import quote
from browser_use import Agent, Controller
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
import uvicorn
from typing import List
import asyncio
import zipcodes
from baml_client import b as baml
from baml_client.types import Quote
from .database import Database
from .models import FindBusinessesResult, Business

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

database = Database()

# Load environment variables
load_dotenv()

# Check required environment variables
ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY')
ELEVENLABS_AGENT_ID = os.getenv('ELEVENLABS_AGENT_ID')
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')

required_vars = [
  ELEVENLABS_API_KEY,
  ELEVENLABS_AGENT_ID,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER
]

if not all(required_vars):
  raise ValueError('Missing required environment variables')

# Initialize Twilio client
twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  
find_businesses_task = """Find the URLs and phone numbers of any 10 small businesses that provide the service mentioned below, and in the county mentioned below. 

Use Google Search adding 'phone number' to the query, and get the URL and phone number just from the results pages. Click on next pages of results to find more businesses if some on the first page are missing phone numbers. Do not click any links. Avoid businesses where Yelp or other aggregator is the URL.

Service: {item_type}
County: {county}
"""

phone_agent_prompt = """You are someone calling local businesses to get quotes on services. Keep your tone casual and conversational, and add a few pauses, ums and ahs to make it sound natural.

Start by giving the basic context on what you're looking for by saying something like 'Hi, I'm looking for ...', don't provide any personal information or the service details unless asked.

If requested, answer questions based on the information below, without going into too much detail. Steer the conversation towards getting a quote.

Here is the relevant information:
Your Name: {user_name}
Your Phone Number: {user_phone_number}
Your Location: {user_location}
Service: {service_description}
Service Detail: {service_detail}
Business You Are Calling: {business_name}

Notes:
- If you're asked for personal information outside of the information above, defer and avoid providing any information.
- If you are asked something else that's not in the information above, just say you're not sure and make up an excuse. Push towards getting a quote as soon as possible, but be polite.
- Once you get quotes, ask if you can get a 10 percent discount.
- End the call immediately after getting an answer back about the discount, telling them you'll think about it and get back to them.

"""

@app.post("/find-businesses")
async def find_businesses(request: Request):
  data = await request.json()
  item_type = data.get("item_type")
  location = data.get("location")
  county = zipcodes.matching(location)[0]["county"]
  try:
    controller = Controller(output_model=FindBusinessesResult)
    agent = Agent(
      task=find_businesses_task.format(item_type=item_type, county=county),
      llm=ChatOpenAI(model="gpt-4o"),
      controller=controller,
    )
    history = await agent.run()
    result = history.final_result()
    if result:
      parsed: FindBusinessesResult = FindBusinessesResult.model_validate_json(result)
      database.upsert_businesses(parsed.businesses)
      return {"result": parsed}
    else:
      return {"error": "No result found"}
  except Exception as e:
    return {"error": str(e)}
  
async def get_signed_url():
  """Helper function to get signed URL for authenticated conversations"""
  async with httpx.AsyncClient() as client:
    response = await client.get(
      f"https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id={ELEVENLABS_AGENT_ID}",
      headers={"xi-api-key": ELEVENLABS_API_KEY}
    )
    
    if response.status_code != 200:
      raise HTTPException(status_code=response.status_code, detail="Failed to get signed URL")
    
    data = response.json()
    return data["signed_url"]

@app.post("/outbound-call")
async def outbound_call(request: Request):
  """Route to initiate outbound calls"""
  data = await request.json()
  business_number = data.get("business_number")
  business_url = data.get("business_url")
  user_name = "Jason"
  user_phone_number = "(415) 319-7677"
  user_location = zipcodes.matching(data.get("user_location", "94105"))[0]["city"]
  business_name = data.get("business_name")
  service_description = data.get("service_description")
  service_detail = data.get("detail")

  if not business_number:
    raise HTTPException(status_code=400, detail="Business number is required")

  try:
    call = twilio_client.calls.create(
      from_=TWILIO_PHONE_NUMBER,
      to=business_number,
      url=f"https://{request.headers['host']}/outbound-call-twiml?business_name={quote(business_name)}&service_description={quote(service_description)}&user_name={quote(user_name)}&user_phone_number={quote(user_phone_number)}&user_location={quote(user_location)}&business_url={quote(business_url)}&service_detail={quote(service_detail)}",
      method="GET"
    )

    return {
      "success": True,
      "message": "Call initiated",
      "callSid": call.sid
    }
  except Exception as e:
    return JSONResponse(
      status_code=500,
      content={
        "success": False,
        "error": "Failed to initiate call"
      }
    )

@app.get("/outbound-call-twiml")
async def outbound_call_twiml(request: Request):
  """TwiML route for outbound calls"""
  user_name = request.query_params.get("user_name", "")
  user_phone_number = request.query_params.get("user_phone_number", "")
  business_name = request.query_params.get("business_name", "")
  business_url = request.query_params.get("business_url", "")
  service_description = request.query_params.get("service_description", "")
  user_location = request.query_params.get("user_location", "")
  service_detail = request.query_params.get("service_detail", "")

  prompt = phone_agent_prompt.format(business_name=business_name, service_description=service_description, user_name=user_name, user_phone_number=user_phone_number, user_location=user_location, service_detail=service_detail)

  twiml_response = f"""<?xml version="1.0" encoding="UTF-8"?>
  <Response>
    <Connect>
    <Stream url="wss://{request.headers['host']}/outbound-media-stream">
      <Parameter name="prompt" value="{prompt}" />
      <Parameter name="business_url" value="{business_url}" />
    </Stream>
    </Connect>
  </Response>"""

  return Response(content=twiml_response, media_type="text/xml")

@app.websocket("/outbound-media-stream")
async def outbound_media_stream(websocket: WebSocket):
  """WebSocket route for handling media streams"""
  await websocket.accept()
  print("[Server] Twilio connected to outbound media stream")

  # Variables to track the call
  stream_sid = None
  call_sid = None
  elevenlabs_ws = None
  custom_parameters = None
  conversation_id = None

  async def handle_elevenlabs_messages(elevenlabs_ws):
    # Handle messages from ElevenLabs
    async for message in elevenlabs_ws:
      try:
        msg = json.loads(message)
        msg_type = msg.get("type")
        print(f"[ElevenLabs] Received message type: {msg_type}")

        if msg_type == "conversation_initiation_metadata":
          nonlocal conversation_id
          conversation_id = msg.get("conversation_initiation_metadata_event", {}).get("conversation_id")
          print(f"[ElevenLabs] Received conversation ID: {conversation_id}")
          business_url = custom_parameters.get("business_url", "")
          business = database.get_business(business_url=business_url)
          if business:
            business.conversation_id = conversation_id
            database.upsert_businesses([business])

        if msg_type == "audio":
          if stream_sid:
            audio_chunk = msg.get("audio", {}).get("chunk") or msg.get("audio_event", {}).get("audio_base_64")
            if audio_chunk:
              print("[ElevenLabs] Sending audio chunk to Twilio")
              await websocket.send_json({
                "event": "media",
                "streamSid": stream_sid,
                "media": {"payload": audio_chunk}
              })

        elif msg_type == "interruption":
          if stream_sid:
            print("[ElevenLabs] Sending clear event to Twilio")
            await websocket.send_json({
              "event": "clear",
              "streamSid": stream_sid
            })

        elif msg_type == "ping":
          event_id = msg.get("ping_event", {}).get("event_id")
          if event_id:
            print("[ElevenLabs] Responding to ping")
            await elevenlabs_ws.send(json.dumps({
              "type": "pong",
              "event_id": event_id
            }))

      except Exception as e:
        print(f"[ElevenLabs] Error processing message: {e}")

  async def setup_elevenlabs():
    nonlocal elevenlabs_ws
    try:
      signed_url = await get_signed_url()
      elevenlabs_ws = await websockets.connect(signed_url)
      print("[ElevenLabs] Connected to websocket")

      # Send initial configuration
      initial_config = {
        "type": "conversation_initiation_client_data",
        "conversation_config_override": {
          "agent": {
            "prompt": {
              "prompt": custom_parameters.get("prompt", "you are a gary from the phone store"),
              "tools": [
                {
                  "type": "system",
                  "name": "end_call",
                  "description": "Politely say goodbye and end the call as soon as you get a quote."
                }
              ]
            },
          }
        }
      }
      await elevenlabs_ws.send(json.dumps(initial_config))
      print("[ElevenLabs] Sent initial config")

    except Exception as e:
      print(f"[ElevenLabs] Setup error: {e}")

  # Handle messages from Twilio
  try:
    async for message in websocket.iter_json():
      event = message.get("event")
      
      if event == "start":
        stream_sid = message["start"]["streamSid"]
        call_sid = message["start"]["callSid"]
        custom_parameters = message["start"]["customParameters"]
        print(f"[Twilio] Stream started - StreamSid: {stream_sid}, CallSid: {call_sid}")
        await setup_elevenlabs()
        asyncio.create_task(handle_elevenlabs_messages(elevenlabs_ws))

      elif event == "media" and elevenlabs_ws:
        audio_message = {
          "type": "user_audio_chunk",  # Add type field
          "user_audio_chunk": message["media"]["payload"]
        }
        await elevenlabs_ws.send(json.dumps(audio_message))

      elif event == "stop":
        print(f"[Twilio] Stream {stream_sid} ended")
        if elevenlabs_ws:
          await elevenlabs_ws.close()
        break

  except Exception as e:
    print(f"[Twilio] Error: {e}")
  finally:
    if elevenlabs_ws:
      await elevenlabs_ws.close()
    await websocket.close()
    # Get transcript and extract quote
    try:
      await asyncio.sleep(5)
      business = database.get_business(conversation_id=conversation_id)
      if not business:
        raise HTTPException(status_code=404, detail="Business not found")

      async def get_conversation(conversation_id):
        async with httpx.AsyncClient() as client:
          response = await client.get(
            f"https://api.elevenlabs.io/v1/convai/conversations/{conversation_id}",
            headers={"xi-api-key": ELEVENLABS_API_KEY}
          )

          if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to get conversation")

          return response.json()

      conversation = await get_conversation(conversation_id)
      transcript = conversation.get("transcript", "No transcript available")
      transcript_text = ""
      for message in transcript:
        transcript_text += f"{message['role']}: {message['message']}\n\n"
      quote = baml.ExtractQuote(transcript_text)
      business.quote = quote.quote_amount
      business.notes = quote.notes
      database.upsert_businesses([business])
    except Exception as e:
      print(f"[ProcessConversation] Error: {e}")
    

@app.post("/process-conversation")
async def process_conversation(request: Request):
  """Get the transcript from the most recent conversation and extract the quote."""
  conversation_id = request.query_params.get("conversation_id", "")
  business = database.get_business(conversation_id=conversation_id)
  if not business:
    raise HTTPException(status_code=404, detail="Business not found")

  async def get_conversation(conversation_id):
    async with httpx.AsyncClient() as client:
      response = await client.get(
        f"https://api.elevenlabs.io/v1/convai/conversations/{conversation_id}",
        headers={"xi-api-key": ELEVENLABS_API_KEY}
      )

      if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Failed to get conversation")

      return response.json()

  conversation = await get_conversation(conversation_id)
  transcript = conversation.get("transcript", "No transcript available")
  transcript_text = ""
  for message in transcript:
    transcript_text += f"{message['role']}: {message['message']}\n\n"
  quote = baml.ExtractQuote(transcript_text)
  business.quote = quote.quote_amount
  business.notes = quote.notes
  database.upsert_businesses([business])
  return {"transcript": transcript}

def start():
    uvicorn.run(
      "server.main:app",
      host="0.0.0.0",
      port=8080,
      reload=True,
      reload_excludes="subprocess_env/**",
    )