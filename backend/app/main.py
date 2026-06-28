import os
import io
import json
from PIL import Image
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import IMAGES_DIR, RECALL_METRICS_PATH, RECALL_METRICS_IMAGE_PATH
from app.schemas import TextSearchRequest, CompareSearchResponse, SearchResultItem, EngineStatus
from app.search.search_engine import search_engine

app = FastAPI(title="CLIP Sport & Outdoor Search API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

if os.path.exists(IMAGES_DIR):
    app.mount("/images", StaticFiles(directory=IMAGES_DIR), name="images")


def _to_items(results, top_k: int):
    items = []
    for image_path, score in results[:top_k]:
        filename = os.path.basename(image_path)
        prefix = filename[:2]
        items.append(
            SearchResultItem(
                image_path=image_path,
                image_url=f"/images/{prefix}/{filename}",
                score=round(score, 4)
            )
        )
    return items


@app.post("/search/text", response_model=CompareSearchResponse)
def search_text(request: TextSearchRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="La requête ne peut pas être vide")

    zero_shot_items, finetuned_items = [], []

    if request.mode in ("zero_shot", "compare") and search_engine.status["zero_shot_ready"]:
        zero_shot_items = _to_items(search_engine.search_text_zero_shot(request.query, request.top_k), request.top_k)

    if request.mode in ("finetuned", "compare") and search_engine.status["finetuned_ready"]:
        finetuned_items = _to_items(search_engine.search_text_finetuned(request.query, request.top_k), request.top_k)

    return CompareSearchResponse(query=request.query, zero_shot=zero_shot_items, finetuned=finetuned_items)


@app.post("/search/image", response_model=CompareSearchResponse)
async def search_image(
    file: UploadFile = File(...),
    top_k: int = Query(default=8),
    mode: str = Query(default="compare"),
):
    contents = await file.read()
    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Fichier image invalide")

    zero_shot_items, finetuned_items = [], []

    if mode in ("zero_shot", "compare") and search_engine.status["zero_shot_ready"]:
        zero_shot_items = _to_items(search_engine.search_image_zero_shot(image, top_k), top_k)

    if mode in ("finetuned", "compare") and search_engine.status["finetuned_ready"]:
        finetuned_items = _to_items(search_engine.search_image_finetuned(image, top_k), top_k)

    return CompareSearchResponse(zero_shot=zero_shot_items, finetuned=finetuned_items)


@app.get("/metrics")
def get_metrics():
    if not os.path.exists(RECALL_METRICS_PATH):
        raise HTTPException(status_code=404, detail="Métriques non disponibles")
    with open(RECALL_METRICS_PATH) as f:
        return json.load(f)
    
@app.get("/metrics/image-to-image")
def get_image_metrics():
    if not os.path.exists(RECALL_METRICS_IMAGE_PATH):
        raise HTTPException(status_code=404, detail="Métriques image->image non disponibles")
    with open(RECALL_METRICS_IMAGE_PATH) as f:
        return json.load(f)

@app.get("/status", response_model=EngineStatus)
def get_status():
    return EngineStatus(**search_engine.status)


@app.get("/health")
def health():
    return {"status": "ok", **search_engine.status}