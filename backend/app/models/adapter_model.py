import torch
import torch.nn as nn


class ProjectionAdapter(nn.Module):
    """
    Couche de projection ajoutée après les embeddings CLIP.
    Architecture identique à celle utilisée pour l'entraînement (V3) :
    Linear -> GELU -> Dropout -> Linear + connexion résiduelle.
    """

    def __init__(self, embedding_dim: int = 512, hidden_dim: int = 512, dropout: float = 0.0):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(embedding_dim, hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, embedding_dim),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out = x + self.net(x)
        out = out / out.norm(p=2, dim=-1, keepdim=True)
        return out