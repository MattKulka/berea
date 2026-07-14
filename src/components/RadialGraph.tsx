import { motion } from "framer-motion";
import type { CrossReference, SemanticMatch, Verse } from "../lib/types";

type Node = {
  key: string;
  book: string;
  chapter: number;
  verse: number;
  label: string;
  kind: "cross" | "semantic";
  normScore: number;
};

const SIZE = 440;
const CENTER = SIZE / 2;
const MIN_RADIUS = 70;
const MAX_RADIUS = 190;
const MAX_PER_GROUP = 6;

function normalize(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map((v) => (v - min) / (max - min));
}

function buildNodes(crossRefs: CrossReference[], matches: SemanticMatch[]): Node[] {
  const crossTop = crossRefs.slice(0, MAX_PER_GROUP);
  const semanticTop = matches.slice(0, MAX_PER_GROUP);

  const crossScores = normalize(crossTop.map((r) => r.votes));
  const semanticScores = normalize(semanticTop.map((m) => m.similarity));

  const crossNodes: Node[] = crossTop.map((r, i) => ({
    key: `cross-${r.id}`,
    book: r.toStart.book,
    chapter: r.toStart.chapter,
    verse: r.toStart.verse,
    label: `${r.toStart.book} ${r.toStart.chapter}:${r.toStart.verse}`,
    kind: "cross",
    normScore: crossScores[i],
  }));

  const semanticNodes: Node[] = semanticTop.map((m, i) => ({
    key: `semantic-${m.id}`,
    book: m.book,
    chapter: m.chapter,
    verse: m.verse,
    label: `${m.book} ${m.chapter}:${m.verse}`,
    kind: "semantic",
    normScore: semanticScores[i],
  }));

  return [...crossNodes, ...semanticNodes];
}

export function RadialGraph({
  verse,
  crossRefs,
  matches,
  onNavigate,
}: {
  verse: Verse;
  crossRefs: CrossReference[];
  matches: SemanticMatch[];
  onNavigate: (book: string, chapter: number, verse: number) => void;
}) {
  const nodes = buildNodes(crossRefs, matches);
  const n = nodes.length;

  const positioned = nodes.map((node, i) => {
    const angle = (2 * Math.PI * i) / Math.max(n, 1) - Math.PI / 2;
    const radius = MAX_RADIUS - node.normScore * (MAX_RADIUS - MIN_RADIUS);
    const x = CENTER + radius * Math.cos(angle);
    const y = CENTER + radius * Math.sin(angle);
    const isRightHalf = Math.cos(angle) >= 0;
    return { ...node, x, y, isRightHalf };
  });

  const centerKey = `${verse.book}-${verse.chapter}-${verse.verse}`;

  return (
    <div className="radial-graph-wrap">
      <svg key={centerKey} viewBox={`0 0 ${SIZE} ${SIZE}`} className="radial-graph">
        {positioned.map((node) => (
          <motion.line
            key={`line-${node.key}`}
            x1={CENTER}
            y1={CENTER}
            x2={node.x}
            y2={node.y}
            stroke={node.kind === "cross" ? "var(--accent)" : "var(--ink-soft)"}
            strokeWidth={1 + node.normScore}
            strokeDasharray={node.kind === "semantic" ? "4 4" : undefined}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 + node.normScore * 0.35 }}
            transition={{ duration: 0.4 }}
          />
        ))}

        {positioned.map((node, i) => (
          <g key={node.key} className="radial-node" onClick={() => onNavigate(node.book, node.chapter, node.verse)}>
            <motion.circle
              cx={node.x}
              cy={node.y}
              fill={node.kind === "cross" ? "var(--accent)" : "var(--bg-elevated)"}
              stroke="var(--accent)"
              strokeWidth={node.kind === "semantic" ? 1.5 : 0}
              initial={{ r: 0, opacity: 0 }}
              animate={{ r: 5 + node.normScore * 7, opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.08 + i * 0.03 }}
            />
            <motion.text
              x={node.x + (node.isRightHalf ? 1 : -1) * (10 + node.normScore * 7)}
              y={node.y}
              textAnchor={node.isRightHalf ? "start" : "end"}
              dominantBaseline="middle"
              className="radial-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.15 + i * 0.03 }}
            >
              {node.label}
            </motion.text>
          </g>
        ))}

        <circle cx={CENTER} cy={CENTER} r={34} fill="var(--accent)" />
        <text x={CENTER} y={CENTER - 4} textAnchor="middle" className="radial-center-label">
          {verse.book} {verse.chapter}
        </text>
        <text x={CENTER} y={CENTER + 12} textAnchor="middle" className="radial-center-label">
          :{verse.verse}
        </text>
      </svg>
      <div className="radial-legend">
        <span>
          <i className="legend-dot legend-dot-cross" /> Cross reference
        </span>
        <span>
          <i className="legend-dot legend-dot-semantic" /> Semantically related
        </span>
      </div>
    </div>
  );
}
