import { MEASUREMENT_POINTS, MeasurementPoint } from '../lib/bodyMeasurements';

interface BodyDiagramProps {
  selectedId: string | null;
  completedIds: Set<string>;
  onSelectPoint: (point: MeasurementPoint) => void;
}

export function BodyDiagram({ selectedId, completedIds, onSelectPoint }: BodyDiagramProps) {
  return (
    <div className="relative w-full max-w-[300px] mx-auto">
      <svg
        viewBox="0 0 300 480"
        className="w-full h-auto"
        style={{ maxHeight: '600px' }}
      >
        <defs>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" className="[stop-color:#e5e7eb] dark:[stop-color:#374151]" />
            <stop offset="100%" className="[stop-color:#d1d5db] dark:[stop-color:#4b5563]" />
          </linearGradient>
        </defs>

        <ellipse cx="150" cy="35" rx="25" ry="30" fill="url(#bodyGradient)" stroke="#9ca3af" strokeWidth="1.5" />

        <path
          d="M100 65 Q90 75 85 95 L75 130 Q70 145 75 160 L60 220 Q58 230 65 235 L75 232 Q80 230 82 225 L95 175 Q98 165 100 175 L100 210 Q95 250 100 290 L95 380 Q93 400 100 420 L105 455 Q108 465 120 465 L130 465 Q140 463 138 450 L130 380 Q125 320 130 290 L140 230 Q145 215 150 215 Q155 215 160 230 L170 290 Q175 320 170 380 L162 450 Q160 463 170 465 L180 465 Q192 465 195 455 L200 420 Q207 400 205 380 L200 290 Q205 250 200 210 L200 175 Q202 165 205 175 L218 225 Q220 230 225 232 L235 235 Q242 230 240 220 L225 160 Q230 145 225 130 L215 95 Q210 75 200 65 L190 60 Q175 55 150 55 Q125 55 110 60 Z"
          fill="url(#bodyGradient)"
          stroke="#9ca3af"
          strokeWidth="1.5"
        />

        {MEASUREMENT_POINTS.map((point, index) => {
          const isSelected = selectedId === point.id;
          const isCompleted = completedIds.has(point.id);

          return (
            <g
              key={point.id}
              className="cursor-pointer"
              onClick={() => onSelectPoint(point)}
            >
              <circle
                cx={point.x}
                cy={point.y}
                r={isSelected ? 14 : 12}
                className={`transition-all duration-200 ${
                  isSelected
                    ? 'fill-[#506B4D] dark:fill-[#7ba76a]'
                    : isCompleted
                      ? 'fill-green-500 dark:fill-green-400'
                      : 'fill-white dark:fill-gray-700'
                }`}
                stroke={isSelected ? '#3d5139' : isCompleted ? '#22c55e' : '#9ca3af'}
                strokeWidth={isSelected ? 3 : 2}
              />
              {isSelected && (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={20}
                  fill="none"
                  stroke="#506B4D"
                  strokeWidth="2"
                  opacity="0.3"
                  className="animate-ping"
                />
              )}
              <text
                x={point.x}
                y={point.y + 4}
                textAnchor="middle"
                className={`text-xs font-bold pointer-events-none ${
                  isSelected || isCompleted
                    ? 'fill-white'
                    : 'fill-gray-600 dark:fill-gray-300'
                }`}
              >
                {index + 1}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Click a numbered point to measure
      </div>
    </div>
  );
}
