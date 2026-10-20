import React, { useState, useRef } from 'react';
import { PlyEvaluation } from '../types/chess';
import { CLASSIFICATION_CONFIG } from './Chessboard';
import { TrendingUp } from 'lucide-react';

interface SmoothAdvantageChartProps {
  plies: PlyEvaluation[];
  currentPly: number;
  middlegameStartPly: number;
  endgameStartPly: number;
  onSelectPly: (ply: number) => void;
  userColor: 'w' | 'b';
}

/**
 * Compute Catmull-Rom or cubic Bézier path for smooth line curvature
 */
function createCurvedPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    // Catmull-Rom to Cubic Bezier control points (tension = 0.5)
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return path;
}

export const SmoothAdvantageChart: React.FC<SmoothAdvantageChartProps> = ({
  plies,
  currentPly,
  middlegameStartPly,
  endgameStartPly,
  onSelectPly,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredPly, setHoveredPly] = useState<PlyEvaluation | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  if (plies.length === 0) return null;

  const totalPlies = plies.length;
  const width = 1000;
  const height = 150;
  const midY = height / 2;
  const padX = 20;
  const padY = 16;

  // Convert each ply to (x, y) coordinates
  const points = plies.map((ply, i) => {
    const x = padX + (i / (totalPlies - 1 || 1)) * (width - padX * 2);
    // winProb is 0.0 to 1.0 (White perspective)
    // 1.0 = top (y = padY), 0.0 = bottom (y = height - padY)
    const y = padY + (1 - ply.winProb) * (height - padY * 2);
    return { x, y, ply };
  });

  const curveD = createCurvedPath(points);

  // Close path for gradient area fill
  const firstX = points[0].x;
  const lastX = points[points.length - 1].x;
  const areaD = `${curveD} L ${lastX} ${midY} L ${firstX} ${midY} Z`;

  // Position of currently selected ply
  const selectedPoint = currentPly > 0 && currentPly <= totalPlies ? points[currentPly - 1] : null;

  // Handle click / drag scrub
  const handleInteraction = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, relX / rect.width));
    const targetPly = Math.max(1, Math.min(totalPlies, Math.round(ratio * (totalPlies - 1)) + 1));
    onSelectPly(targetPly);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, relX / rect.width));
    const targetIdx = Math.max(0, Math.min(totalPlies - 1, Math.round(ratio * (totalPlies - 1))));
    setHoveredPly(plies[targetIdx]);
    setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div className="w-full flex flex-col rounded-2xl bg-[#211f1c] border border-[#36332e] overflow-hidden shadow-xl select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#262421] border-b border-[#36332e]">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold text-white tracking-wide">
            Advantage Timeline (Win% Win Probability)
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#8e8a83] font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sky-400" /> White+
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-zinc-500" /> Black+
          </span>
        </div>
      </div>

      {/* SVG Line Chart Canvas */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredPly(null)}
        onClick={(e) => handleInteraction(e.clientX)}
        className="relative w-full h-36 sm:h-40 cursor-crosshair bg-[#181715]"
      >
        <svg
          className="w-full h-full"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          <defs>
            {/* Top gradient (White advantage) */}
            <linearGradient id="whiteAdvGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02" />
            </linearGradient>

            {/* Bottom gradient (Black advantage) */}
            <linearGradient id="blackAdvGradient" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Neutral 50% Equality Line */}
          <line
            x1="0"
            y1={midY}
            x2={width}
            y2={midY}
            stroke="#423e38"
            strokeWidth="1.2"
            strokeDasharray="4,4"
          />

          {/* Area Fill */}
          <path d={areaD} fill="url(#whiteAdvGradient)" />

          {/* Smooth Curving Advantage Line */}
          <path
            d={curveD}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Middlegame Phase Divider */}
          {middlegameStartPly > 0 && middlegameStartPly <= totalPlies && (
            <g>
              <line
                x1={points[middlegameStartPly - 1].x}
                y1="12"
                x2={points[middlegameStartPly - 1].x}
                y2={height - 12}
                stroke="#60a5fa"
                strokeWidth="1.2"
                strokeDasharray="3,3"
                opacity="0.75"
              />
              <text
                x={points[middlegameStartPly - 1].x}
                y="18"
                fill="#93c5fd"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
              >
                Middlegame
              </text>
            </g>
          )}

          {/* Endgame Phase Divider */}
          {endgameStartPly > 0 && endgameStartPly <= totalPlies && (
            <g>
              <line
                x1={points[endgameStartPly - 1].x}
                y1="12"
                x2={points[endgameStartPly - 1].x}
                y2={height - 12}
                stroke="#34d399"
                strokeWidth="1.2"
                strokeDasharray="3,3"
                opacity="0.75"
              />
              <text
                x={points[endgameStartPly - 1].x}
                y="18"
                fill="#6ee7b7"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
              >
                Endgame
              </text>
            </g>
          )}

          {/* Active Scrubber Marker */}
          {selectedPoint && (
            <g>
              <line
                x1={selectedPoint.x}
                y1="0"
                x2={selectedPoint.x}
                y2={height}
                stroke="#fbbf24"
                strokeWidth="1.8"
                opacity="0.7"
              />
              <circle
                cx={selectedPoint.x}
                cy={selectedPoint.y}
                r="5"
                fill="#fbbf24"
                stroke="#161512"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPly && hoverPos && (
          <div
            style={{
              left: `${Math.min(hoverPos.x + 12, (containerRef.current?.clientWidth || 300) - 130)}px`,
              top: `${Math.max(10, hoverPos.y - 45)}px`,
            }}
            className="pointer-events-none absolute z-30 flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#262421]/95 border border-[#423e38] shadow-2xl backdrop-blur-md animate-in fade-in duration-150"
          >
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{
                backgroundColor: CLASSIFICATION_CONFIG[hoveredPly.classification].bg,
                color: CLASSIFICATION_CONFIG[hoveredPly.classification].text,
              }}
            >
              {CLASSIFICATION_CONFIG[hoveredPly.classification].label}
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-[11px] font-mono text-white">
                <span className="font-bold">{hoveredPly.ply}.</span>
                <span>{hoveredPly.san}</span>
              </div>
              <span className="text-[10px] text-sky-300 font-mono">
                Win: {(hoveredPly.winProb * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
