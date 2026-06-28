import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
IMAGES_DIR = os.path.join(DATA_DIR, "images")

# Index FAISS : zero-shot (baseline) et fine-tuné (V3)
BASELINE_INDEX_PATH = os.path.join(DATA_DIR, "index", "baseline_zeroshot.index")
BASELINE_MAPPING_PATH = os.path.join(DATA_DIR, "index", "baseline_id_to_path.json")

FINETUNED_INDEX_PATH = os.path.join(DATA_DIR, "index", "finetuned_v3.index")
FINETUNED_MAPPING_PATH = os.path.join(DATA_DIR, "index", "finetuned_v3_id_to_path.json")

# Checkpoint du modèle fine-tuné
ADAPTER_CHECKPOINT_PATH = os.path.join(DATA_DIR, "checkpoints", "adapter_v3_best.pt")

CLIP_MODEL_NAME = "openai/clip-vit-base-patch32"
EMBEDDING_DIM = 512

DEVICE = "cpu"  # on reste sur CPU en local, simple et suffisant pour la démo

RECALL_METRICS_PATH = os.path.join(DATA_DIR, "metrics", "recall_comparison_all.json")
RECALL_METRICS_IMAGE_PATH = os.path.join(DATA_DIR, "metrics", "image_to_image_recall.json")