from fastapi import UploadFile
from typing import List, Optional, Tuple, Union, Dict
from supabase import create_client, Client
import os
from .models import FindBusinessesResult, Business
from dotenv import load_dotenv
from typing import Optional


class Database:
  def __init__(self):
    load_dotenv()
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")
    self.supabase = create_client(supabase_url, supabase_key)
  
  def get_business(self, business_url: str) -> Optional[Business]:
    response = self.supabase.table("businesses").select("*").eq("url", business_url).execute()
    return response.data[0] if response.data else None

  def upsert_businesses(self, businesses: List[Business]) -> Optional[List[Business]]:
    business_dicts = [business.model_dump() for business in businesses]
    
    response = (
      self.supabase.table("businesses")
      .upsert(business_dicts, on_conflict="url")
      .execute()
    )
    return response.data