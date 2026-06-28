from pydantic import BaseModel
from typing import Optional


class SearchResultItem(BaseModel):
    image_path: str
    image_url: str
    score: float


class TextSearchRequest(BaseModel):
    query: str
    top_k: int = 8
    mode: str = "compare"


class CompareSearchResponse(BaseModel):
    query: Optional[str] = None
    zero_shot: list[SearchResultItem]
    finetuned: list[SearchResultItem]


class EngineStatus(BaseModel):
    zero_shot_ready: bool
    finetuned_ready: bool
    zero_shot_vectors: int
    finetuned_vectors: int