from pydantic import BaseModel
from typing import List, Optional

class Dealership(BaseModel):
  name: str
  url: str
  phone_number: int

class FindDealershipsResult(BaseModel):
  dealerships: List[Dealership]