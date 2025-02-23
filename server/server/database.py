from fastapi import UploadFile
from typing import List, Optional, Tuple, Union, Dict
from supabase import create_client, Client
import os
from .models import FindDealershipsResult, Dealership
from dotenv import load_dotenv
from typing import Optional


class Database:
    def __init__(self):
        load_dotenv()
        supabase_url = os.environ.get("SUPABASE_URL")
        supabase_key = os.environ.get("SUPABASE_KEY")
        self.supabase = create_client(supabase_url, supabase_key)

    def save_dealerships(self, dealerships: List[Dealership]) -> Optional[List[Dealership]]:
        dealership_dicts = [dealership.model_dump() for dealership in dealerships]
        
        response = (
            self.supabase.table("dealerships")
            .upsert(dealership_dicts, on_conflict="url")
            .execute()
        )
        return response.data
  
    