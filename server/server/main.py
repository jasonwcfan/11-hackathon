import os
import json
import base64
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, HTTPException, Request
from fastapi.responses import JSONResponse, Response
from twilio.rest import Client
import httpx
import websockets
from urllib.parse import quote
from browser_use import Agent, Controller
from langchain_anthropic import ChatAnthropic
import uvicorn
from typing import List
from .database import Database
from .models import FindDealershipsResult, Dealership

app = FastAPI()
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
  
find_dealerships_task = """Find the URLs of the top 10 Toyota dealerships in the San Francisco Bay Area.

Then visit each URL and get the name and phone number of the dealership.
"""

@app.post("/find-dealerships")
async def find_dealerships():
  try:
    controller = Controller(output_model=FindDealershipsResult)
    agent = Agent(
      task=find_dealerships_task,
      llm=ChatAnthropic(model="claude-3-5-sonnet-latest"),
      controller=controller,
    )
    history = await agent.run()
    result = history.final_result()
    if result:
      parsed: FindDealershipsResult = FindDealershipsResult.model_validate_json(result)
      database.save_dealerships(parsed.dealerships)
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
  number = data.get("number")
  prompt = data.get("prompt")
  first_message = data.get("first_message")

  if not number:
    raise HTTPException(status_code=400, detail="Phone number is required")

  try:
    call = twilio_client.calls.create(
      from_=TWILIO_PHONE_NUMBER,
      to=number,
      url=f"https://{request.headers['host']}/outbound-call-twiml?prompt={quote(prompt)}&first_message={quote(first_message)}",
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
  prompt = request.query_params.get("prompt", "")
  first_message = request.query_params.get("first_message", "")

  twiml_response = f"""<?xml version="1.0" encoding="UTF-8"?>
  <Response>
    <Connect>
    <Stream url="wss://{request.headers['host']}/outbound-media-stream">
      <Parameter name="prompt" value="{prompt}" />
      <Parameter name="first_message" value="{first_message}" />
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
              "prompt": custom_parameters.get("prompt", "you are a gary from the phone store")
            },
            "first_message": custom_parameters.get("first_message", "hey there! how can I help you today?")
          }
        }
      }
      await elevenlabs_ws.send(json.dumps(initial_config))
      print("[ElevenLabs] Sent initial config")

      # Handle messages from ElevenLabs
      async for message in elevenlabs_ws:
        try:
          msg = json.loads(message)
          msg_type = msg.get("type")
          print(f"[ElevenLabs] Received message type: {msg_type}")

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

    except Exception as e:
      print(f"[ElevenLabs] Setup error: {e}")

  # Handle messages from Twilio
  try:
    async for message in websocket.iter_json():
      event = message.get("event")
      print(f"[Twilio] Received event: {event}")
      
      if event == "start":
        stream_sid = message["start"]["streamSid"]
        call_sid = message["start"]["callSid"]
        custom_parameters = message["start"]["customParameters"]
        print(f"[Twilio] Stream started - StreamSid: {stream_sid}, CallSid: {call_sid}")
        await setup_elevenlabs()

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

def start():
    uvicorn.run(
      "server.main:app",
      host="0.0.0.0",
      port=8080,
      reload=True,
      reload_excludes="subprocess_env/**",
    )