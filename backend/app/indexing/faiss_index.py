import json
import faiss
import numpy as np


class FaissIndex:
    def __init__(self, dim: int = 512):
        self.dim = dim
        self.index = faiss.IndexFlatIP(dim)
        self.id_to_path = {}

    def add(self, embeddings: np.ndarray, image_paths: list):
        assert embeddings.shape[0] == len(image_paths)
        start_id = self.index.ntotal
        self.index.add(embeddings.astype(np.float32))
        for i, path in enumerate(image_paths):
            self.id_to_path[start_id + i] = path

    def search(self, query_embedding: np.ndarray, top_k: int = 5):
        scores, indices = self.index.search(query_embedding.astype(np.float32), top_k)
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue
            results.append((self.id_to_path[int(idx)], float(score)))
        return results

    def save(self, index_path: str, mapping_path: str):
        faiss.write_index(self.index, index_path)
        with open(mapping_path, "w", encoding="utf-8") as f:
            json.dump(self.id_to_path, f)

    def load(self, index_path: str, mapping_path: str):
        self.index = faiss.read_index(index_path)
        with open(mapping_path, "r", encoding="utf-8") as f:
            raw = json.load(f)
        self.id_to_path = {int(k): v for k, v in raw.items()}
        return self