import os
import torch
import numpy as np
from PIL import Image

from app.config import (
    BASELINE_INDEX_PATH, BASELINE_MAPPING_PATH,
    FINETUNED_INDEX_PATH, FINETUNED_MAPPING_PATH,
    ADAPTER_CHECKPOINT_PATH, EMBEDDING_DIM, DEVICE,
)
from app.models.clip_model import CLIPEmbedder
from app.models.adapter_model import ProjectionAdapter
from app.indexing.faiss_index import FaissIndex


class DualSearchEngine:
    """
    Gère deux pipelines de recherche complets en parallèle :
      - "zero_shot" : CLIP pré-entraîné brut + index baseline
      - "finetuned"  : CLIP partiellement fine-tuné + adapter + index fine-tuné
    """

    def __init__(self):
        self.device = DEVICE

        self.clip_zero_shot = CLIPEmbedder(device=self.device)
        self.index_zero_shot = FaissIndex(dim=EMBEDDING_DIM)
        self._loaded_zero_shot = self._try_load_index(
            self.index_zero_shot, BASELINE_INDEX_PATH, BASELINE_MAPPING_PATH
        )

        self.clip_finetuned = CLIPEmbedder(device=self.device)
        self.adapter_img = ProjectionAdapter(embedding_dim=EMBEDDING_DIM).to(self.device)
        self.adapter_txt = ProjectionAdapter(embedding_dim=EMBEDDING_DIM).to(self.device)
        self.index_finetuned = FaissIndex(dim=EMBEDDING_DIM)
        self._loaded_finetuned = self._try_load_finetuned()

    def _try_load_index(self, index_obj, index_path, mapping_path) -> bool:
        if os.path.exists(index_path) and os.path.exists(mapping_path):
            index_obj.load(index_path, mapping_path)
            return True
        return False

    def _try_load_finetuned(self) -> bool:
        if not os.path.exists(ADAPTER_CHECKPOINT_PATH):
            return False
        checkpoint = torch.load(ADAPTER_CHECKPOINT_PATH, map_location=self.device)
        if "clip_state" in checkpoint:
            self.clip_finetuned.load_finetuned_weights(checkpoint["clip_state"])
        self.adapter_img.load_state_dict(checkpoint["adapter_img_state"])
        self.adapter_txt.load_state_dict(checkpoint["adapter_txt_state"])
        self.adapter_img.eval()
        self.adapter_txt.eval()
        return self._try_load_index(self.index_finetuned, FINETUNED_INDEX_PATH, FINETUNED_MAPPING_PATH)

    @property
    def status(self) -> dict:
        return {
            "zero_shot_ready": self._loaded_zero_shot,
            "finetuned_ready": self._loaded_finetuned,
            "zero_shot_vectors": self.index_zero_shot.index.ntotal if self._loaded_zero_shot else 0,
            "finetuned_vectors": self.index_finetuned.index.ntotal if self._loaded_finetuned else 0,
        }

    def search_text_zero_shot(self, query: str, top_k: int = 8):
        embedding = self.clip_zero_shot.encode_text([query]).numpy().astype(np.float32)
        return self.index_zero_shot.search(embedding, top_k)

    def search_text_finetuned(self, query: str, top_k: int = 8):
        with torch.no_grad():
            txt_feat = self.clip_finetuned.encode_text([query]).to(self.device)
            adapted = self.adapter_txt(txt_feat).cpu().numpy().astype(np.float32)
        return self.index_finetuned.search(adapted, top_k)

    def search_image_zero_shot(self, image: Image.Image, top_k: int = 8):
        embedding = self.clip_zero_shot.encode_images([image]).numpy().astype(np.float32)
        return self.index_zero_shot.search(embedding, top_k)

    def search_image_finetuned(self, image: Image.Image, top_k: int = 8):
        with torch.no_grad():
            img_feat = self.clip_finetuned.encode_images([image]).to(self.device)
            adapted = self.adapter_img(img_feat).cpu().numpy().astype(np.float32)
        return self.index_finetuned.search(adapted, top_k)


# Singleton chargé une fois au démarrage de l'API
search_engine = DualSearchEngine()