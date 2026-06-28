import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import axios from "axios";

const API_URL = import.meta.env.PROD ? "" : "http://localhost:8000";

const TEXT_MODEL_LABELS = {
  baseline: "Zero-shot",
  finetuned_v1: "V1",
  finetuned_v2: "V2",
  finetuned_v3: "V3",
};
const IMAGE_MODEL_LABELS = { zero_shot: "Zero-shot", finetuned_v3: "V3" };
const COLORS = ["#5d6478", "#7f77dd", "#a594f9", "#6366f1"];

export default function MetricsDashboard() {
  const [textMetrics, setTextMetrics] = useState(null);
  const [imageMetrics, setImageMetrics] = useState(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("text"); // 'text' | 'image'

  useEffect(() => {
    axios
      .get(`${API_URL}/metrics`)
      .then((res) => setTextMetrics(res.data))
      .catch(() => {});
    axios
      .get(`${API_URL}/metrics/image-to-image`)
      .then((res) => setImageMetrics(res.data))
      .catch(() => {});
  }, []);

  if (!textMetrics) return null;

  const labels = mode === "text" ? TEXT_MODEL_LABELS : IMAGE_MODEL_LABELS;
  const data = mode === "text" ? textMetrics : imageMetrics;

  const chartData = data
    ? ["1", "5", "10"].map((k) => {
        const row = { k: `Recall@${k}` };
        Object.keys(labels).forEach((key) => {
          if (data[key])
            row[labels[key]] = Math.round(data[key][k] * 1000) / 10;
        });
        return row;
      })
    : [];

  return (
    <div style={styles.wrapper}>
      <button onClick={() => setOpen((o) => !o)} style={styles.toggle}>
        Benchmark Recall@K {open ? "▲" : "▼"}
      </button>
      {open && (
        <div style={styles.panel}>
          <div style={styles.tabRow}>
            <button
              onClick={() => setMode("text")}
              style={{
                ...styles.tab,
                ...(mode === "text" ? styles.tabActive : {}),
              }}
            >
              Texte → Image
            </button>
            <button
              onClick={() => setMode("image")}
              style={{
                ...styles.tab,
                ...(mode === "image" ? styles.tabActive : {}),
              }}
              disabled={!imageMetrics}
            >
              Image → Image
            </button>
          </div>

          <p style={styles.caption}>
            {mode === "text"
              ? "Recherche sémantique texte→image, comparée sur 4 configurations (zero-shot, V1, V2, V3)."
              : "Cohérence catégorielle de la recherche par similarité d'image, zero-shot vs V3."}
          </p>

          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border-subtle)"
                  vertical={false}
                />
                <XAxis
                  dataKey="k"
                  stroke="var(--text-tertiary)"
                  fontSize={12}
                />
                <YAxis stroke="var(--text-tertiary)" fontSize={12} unit="%" />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-surface-raised)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                {Object.values(labels).map((label, i) => (
                  <Bar
                    key={label}
                    dataKey={label}
                    fill={COLORS[i]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: { width: "100%", maxWidth: 720, margin: "32px auto 0" },
  toggle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    justifyContent: "center",
    background: "transparent",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-full)",
    padding: "10px 18px",
    color: "var(--text-secondary)",
    fontSize: 13,
    cursor: "pointer",
  },
  panel: {
    marginTop: 16,
    padding: 20,
    background: "var(--bg-surface)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-lg)",
  },
  tabRow: { display: "flex", gap: 8, marginBottom: 14 },
  tab: {
    flex: 1,
    padding: "8px 14px",
    fontSize: 13,
    background: "var(--bg-surface-raised)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-full)",
    color: "var(--text-tertiary)",
    cursor: "pointer",
  },
  tabActive: {
    color: "var(--text-primary)",
    borderColor: "var(--accent-indigo-bright)",
    background: "var(--bg-surface)",
  },
  caption: {
    fontSize: 12.5,
    color: "var(--text-tertiary)",
    margin: "0 0 12px",
    lineHeight: 1.5,
  },
};
