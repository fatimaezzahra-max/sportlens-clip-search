import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

from app.config import CLIP_MODEL_NAME


def _extract_tensor(output):
    if isinstance(output, torch.Tensor):
        return output
    if hasattr(output, "pooler_output"):
        return output.pooler_output
    if hasattr(output, "last_hidden_state"):
        return output.last_hidden_state[:, 0, :]
    return output[0]


class CLIPEmbedder:
    def __init__(self, model_name: str = CLIP_MODEL_NAME, device: str = "cpu"):
        self.device = device
        self.model = CLIPModel.from_pretrained(model_name).to(self.device)
        self.processor = CLIPProcessor.from_pretrained(model_name)
        self.model.eval()

    def load_finetuned_weights(self, clip_state_dict: dict):
        """Remplace les poids du modèle par ceux d'un checkpoint fine-tuné."""
        self.model.load_state_dict(clip_state_dict)
        self.model.eval()

    @torch.no_grad()
    def encode_images(self, images: list, batch_size: int = 16) -> torch.Tensor:
        all_feats = []
        for i in range(0, len(images), batch_size):
            batch = images[i:i + batch_size]
            inputs = self.processor(images=batch, return_tensors="pt").to(self.device)
            feats = self.model.get_image_features(**inputs)
            feats = _extract_tensor(feats)
            feats = feats / feats.norm(p=2, dim=-1, keepdim=True)
            all_feats.append(feats.cpu())
        return torch.cat(all_feats, dim=0)

    @torch.no_grad()
    def encode_text(self, texts: list, batch_size: int = 32) -> torch.Tensor:
        all_feats = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            inputs = self.processor(
                text=batch, return_tensors="pt", padding=True, truncation=True
            ).to(self.device)
            feats = self.model.get_text_features(**inputs)
            feats = _extract_tensor(feats)
            feats = feats / feats.norm(p=2, dim=-1, keepdim=True)
            all_feats.append(feats.cpu())
        return torch.cat(all_feats, dim=0)