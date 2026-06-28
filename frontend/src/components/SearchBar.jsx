import { useState, useRef } from "react";
import { motion } from "framer-motion";

export default function SearchBar({ onTextSearch, onImageSearch, loading }) {
  const [query, setQuery] = useState("");
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) onTextSearch(query.trim());
  };

  const examples = [
    "a man surfing a big wave",
    "children playing soccer",
    "a cyclist racing on a mountain trail",
  ];

  return (
    <div style={styles.wrapper}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputRow}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={styles.searchIcon}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Décris une scène sportive..."
            style={styles.input}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={styles.uploadButton}
            disabled={loading}
            title="Rechercher par image"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImageSearch(f);
            }}
            style={{ display: "none" }}
          />
          <motion.button
            type="submit"
            style={styles.submitButton}
            disabled={loading || !query.trim()}
            whileTap={{ scale: 0.96 }}
          >
            {loading ? "Recherche..." : "Rechercher"}
          </motion.button>
        </div>
      </form>

      <div style={styles.examples}>
        <span style={styles.examplesLabel}>Essayer :</span>
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => {
              setQuery(ex);
              onTextSearch(ex);
            }}
            style={styles.exampleChip}
            disabled={loading}
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  wrapper: { width: "100%", maxWidth: 720, margin: "0 auto" },
  form: { width: "100%" },
  inputRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "var(--bg-surface)",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius-full)",
    padding: "6px 6px 6px 16px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
    flexWrap: "wrap",
  },
  searchIcon: { color: "var(--text-tertiary)", flexShrink: 0 },
  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "var(--text-primary)",
    fontSize: 16,
    fontFamily: "var(--font-body)",
    padding: "12px 4px",
  },
  uploadButton: {
    width: 40,
    height: 40,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg-surface-raised)",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius-full)",
    color: "var(--text-secondary)",
    cursor: "pointer",
  },
  submitButton: {
    flexShrink: 0,
    padding: "10px 18px",
    background: "var(--gradient-signature)",
    border: "none",
    borderRadius: "var(--radius-full)",
    color: "#fff",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  examples: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
    paddingLeft: 8,
  },
  examplesLabel: {
    fontSize: 13,
    color: "var(--text-tertiary)",
    marginRight: 4,
  },
  exampleChip: {
    fontSize: 13,
    padding: "6px 14px",
    background: "var(--bg-surface)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-full)",
    color: "var(--text-secondary)",
    cursor: "pointer",
  },
};
