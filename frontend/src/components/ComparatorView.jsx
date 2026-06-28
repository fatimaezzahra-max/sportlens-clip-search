import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = import.meta.env.PROD ? "" : "http://localhost:8000";

function ResultCard({ item, rank, accent }) {
  const pct = Math.round(item.score * 100);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      transition={{ delay: rank * 0.04, duration: 0.35 }}
      style={styles.card}
    >
      <div style={styles.imageWrap}>
        <motion.img
          src={`${API_URL}${item.image_url}`}
          alt=""
          style={styles.image}
          loading="lazy"
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.3 }}
        />
        <div style={{ ...styles.rankBadge, background: accent }}>
          {rank + 1}
        </div>
      </div>
      <div style={styles.scoreRow}>
        <div style={styles.scoreTrack}>
          <motion.div
            style={{ ...styles.scoreFill, background: accent }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ delay: rank * 0.04 + 0.1, duration: 0.5 }}
          />
        </div>
        <span style={styles.scoreText}>{pct}%</span>
      </div>
    </motion.div>
  );
}

function ResultColumn({ title, subtitle, items, accent, loading, emptyHint }) {
  return (
    <div style={styles.column}>
      <div style={styles.columnHeader}>
        <div style={{ ...styles.dot, background: accent }} />
        <div>
          <div style={styles.columnTitle}>{title}</div>
          <div style={styles.columnSubtitle}>{subtitle}</div>
        </div>
      </div>
      {loading && (
        <div style={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={styles.skeleton} />
          ))}
        </div>
      )}
      {!loading && items.length === 0 && (
        <div style={styles.emptyState}>{emptyHint}</div>
      )}
      {!loading && items.length > 0 && (
        <div style={styles.grid}>
          <AnimatePresence>
            {items.map((item, i) => (
              <ResultCard
                key={item.image_url}
                item={item}
                rank={i}
                accent={accent}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function AnimatedDelta({ delta }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame;
    const duration = 800;
    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(delta * progress));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [delta]);

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        ...styles.deltaBadge,
        color: delta >= 0 ? "var(--accent-mint)" : "var(--accent-coral)",
        background:
          delta >= 0 ? "var(--accent-mint-dim)" : "var(--accent-coral-dim)",
      }}
    >
      {display >= 0 ? "+" : ""}
      {display}% de confiance avec le fine-tuning
    </motion.span>
  );
}

export default function ComparatorView({ results, loading, query }) {
  const zeroShot = results?.zero_shot || [];
  const finetuned = results?.finetuned || [];

  const avgZeroShot = zeroShot.length
    ? Math.round(
        (zeroShot.reduce((s, r) => s + r.score, 0) / zeroShot.length) * 100,
      )
    : null;
  const avgFinetuned = finetuned.length
    ? Math.round(
        (finetuned.reduce((s, r) => s + r.score, 0) / finetuned.length) * 100,
      )
    : null;
  const delta =
    avgZeroShot !== null && avgFinetuned !== null
      ? avgFinetuned - avgZeroShot
      : null;

  return (
    <div style={styles.wrapper}>
      {query && (
        <div style={styles.queryBar}>
          <span style={styles.queryLabel}>Résultats pour</span>
          <span style={styles.queryText}>« {query} »</span>
          {delta !== null && <AnimatedDelta delta={delta} />}
        </div>
      )}
      <div style={styles.columns}>
        <div style={styles.centerDivider} />
        <ResultColumn
          title="CLIP zero-shot"
          subtitle="Modèle pré-entraîné"
          items={zeroShot}
          accent="var(--text-secondary)"
          loading={loading}
          emptyHint="Lance une recherche."
        />
        <ResultColumn
          title="CLIP fine-tuné · V3"
          subtitle="Adapté au domaine Sport & Outdoor"
          items={finetuned}
          accent="var(--accent-indigo-bright)"
          loading={loading}
          emptyHint="Lance une recherche."
        />
      </div>
    </div>
  );
}

const styles = {
  wrapper: { width: "100%" },
  queryBar: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 28,
    paddingLeft: 4,
  },
  queryLabel: { fontSize: 14, color: "var(--text-tertiary)" },
  queryText: {
    fontFamily: "var(--font-display)",
    fontSize: 17,
    fontWeight: 500,
    color: "var(--text-primary)",
  },
  deltaBadge: {
    fontSize: 12,
    fontWeight: 600,
    padding: "4px 12px",
    borderRadius: "var(--radius-full)",
  },
  columns: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 32,
    position: "relative",
  },
  centerDivider: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: 1,
    background:
      "linear-gradient(180deg, transparent, var(--border-default) 20%, var(--border-default) 80%, transparent)",
    transform: "translateX(-16px)",
  },
  column: { minWidth: 0 },
  columnHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
    paddingBottom: 14,
    borderBottom: "1px solid var(--border-subtle)",
  },
  dot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  columnTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 15,
    fontWeight: 600,
    color: "var(--text-primary)",
  },
  columnSubtitle: {
    fontSize: 12.5,
    color: "var(--text-tertiary)",
    marginTop: 1,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: 14,
  },
  card: {
    background: "var(--bg-surface)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-md)",
    overflow: "hidden",
  },
  imageWrap: {
    position: "relative",
    width: "100%",
    aspectRatio: "1 / 1",
    background: "var(--bg-surface-raised)",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  rankBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    width: 22,
    height: 22,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    color: "#0a0d14",
  },
  scoreRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px 10px",
  },
  scoreTrack: {
    flex: 1,
    height: 4,
    borderRadius: "var(--radius-full)",
    background: "var(--bg-surface-raised)",
    overflow: "hidden",
  },
  scoreFill: { height: "100%", borderRadius: "var(--radius-full)" },
  scoreText: {
    fontSize: 11,
    color: "var(--text-tertiary)",
    minWidth: 30,
    textAlign: "right",
  },
  skeleton: {
    aspectRatio: "1 / 1",
    borderRadius: "var(--radius-md)",
    background:
      "linear-gradient(90deg, var(--bg-surface) 25%, var(--bg-surface-raised) 50%, var(--bg-surface) 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s infinite",
  },
  emptyState: {
    padding: "48px 20px",
    textAlign: "center",
    color: "var(--text-tertiary)",
    fontSize: 13.5,
    background: "var(--bg-surface)",
    border: "1px dashed var(--border-default)",
    borderRadius: "var(--radius-md)",
  },
};
