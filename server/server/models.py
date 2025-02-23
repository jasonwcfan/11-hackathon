from pydantic import BaseModel
from typing import List, Optional

class Business(BaseModel):
  name: str
  url: str
  phone_number: int
  notes: Optional[str]
  quote: Optional[float]

class FindBusinessesResult(BaseModel):
  businesses: List[Business]