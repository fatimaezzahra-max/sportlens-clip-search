import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import SearchBar from "./components/SearchBar";
import ComparatorView from "./components/ComparatorView";
import MetricsDashboard from "./components/MetricsDashboard";

const API_URL = import.meta.env.PROD ? "" : "http://localhost:8000";

export default function App() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);

  const handleTextSearch = async (text) => {
    setLoading(true);
    setError(null);
    setQuery(text);
    setHasSearched(true);
    try {
      const res = await axios.post(`${API_URL}/search/text`, {
        query: text,
        top_k: 15,
        mode: "compare",
      });
      setResults(res.data);
    } catch {
      setError("La recherche a échoué. Vérifie que l'API tourne.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageSearch = async (file) => {
    setLoading(true);
    setError(null);
    setQuery(null);
    setHasSearched(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(
        `${API_URL}/search/image?top_k=15&mode=compare`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      setResults(res.data);
    } catch {
      setError("La recherche a échoué.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button
          onClick={() => {
            setHasSearched(false);
            setResults(null);
            setQuery(null);
            setError(null);
          }}
          style={styles.logoButton}
        >
          <span style={styles.logoMark} />
          SportLens
        </button>
        <span style={styles.headerTag}>CLIP fine-tuné · Sport & Outdoor</span>
      </header>

      <motion.div
        animate={{
          paddingTop: hasSearched ? 32 : 96,
          paddingBottom: hasSearched ? 16 : 48,
        }}
        transition={{ duration: 0.5 }}
        style={styles.hero}
      >
        <AnimatePresence>
          {!hasSearched && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              style={styles.heroText}
            >
              <h1 style={styles.title}>
                Cherche une scène sportive,
                <br />
                en mots ou en image.
              </h1>
              <p style={styles.subtitle}>
                Comparez en direct CLIP pré-entraîné et sa version fine-tunée
                sur 12 682 images Flickr30k (Sport & Outdoor).
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        <SearchBar
          key={hasSearched ? "searched" : "home"}
          onTextSearch={handleTextSearch}
          onImageSearch={handleImageSearch}
          loading={loading}
        />
      </motion.div>

      <main style={styles.main}>
        {error && <div style={styles.errorBox}>{error}</div>}
        {hasSearched && (
          <ComparatorView results={results} loading={loading} query={query} />
        )}
        {!hasSearched && <MetricsDashboard />}
      </main>

      <footer style={styles.footer}>CLIP Fine Tuning</footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    maxWidth: 1100,
    margin: "0 auto",
    padding: "0 24px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "24px 0",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontFamily: "var(--font-display)",
    fontSize: 18,
    fontWeight: 600,
  },
  logoButton: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontFamily: "var(--font-display)",
    fontSize: 18,
    fontWeight: 600,
    background: "transparent",
    border: "none",
    color: "var(--text-primary)",
    cursor: "pointer",
    padding: 0,
  },
  logoMark: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "var(--gradient-signature)",
    animation: "pulse-dot 2s infinite",
  },
  headerTag: {
    fontSize: 12.5,
    color: "var(--text-tertiary)",
    border: "1px solid var(--border-subtle)",
    padding: "5px 12px",
    borderRadius: "var(--radius-full)",
  },
  hero: { textAlign: "center" },
  heroText: { marginBottom: 36, overflow: "hidden" },
  title: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(24px, 5vw, 38px)", // s'adapte à la taille d'écran
    fontWeight: 600,
    lineHeight: 1.2,
    margin: "0 0 14px",
    background: "linear-gradient(135deg, #f1f2f6 30%, #9ca3b5 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: 16,
    color: "var(--text-secondary)",
    maxWidth: 540,
    margin: "0 auto",
    lineHeight: 1.6,
  },
  main: { flex: 1, paddingBottom: 60 },
  errorBox: {
    maxWidth: 720,
    margin: "0 auto 20px",
    padding: "12px 16px",
    background: "var(--accent-coral-dim)",
    color: "var(--accent-coral)",
    borderRadius: "var(--radius-md)",
    fontSize: 13.5,
  },
  footer: {
    textAlign: "center",
    padding: "24px 0",
    fontSize: 12.5,
    color: "var(--text-tertiary)",
    borderTop: "1px solid var(--border-subtle)",
  },
};
