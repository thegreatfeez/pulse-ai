export default function RiskGauge({ score, size = 'md' }) {
  const level = score <= 25 ? 'LOW' : score <= 50 ? 'MODERATE' : score <= 75 ? 'HIGH' : 'EXTREME';
  const color = score <= 25 ? '#10b981' : score <= 50 ? '#f59e0b' : score <= 75 ? '#f97316' : '#ef4444';

  const dim = size === 'sm' ? 60 : size === 'lg' ? 120 : 80;
  const strokeWidth = size === 'sm' ? 5 : size === 'lg' ? 8 : 6;
  const radius = (dim - strokeWidth) / 2;
  const circumference = Math.PI * radius; // half circle
  const offset = circumference - (score / 100) * circumference;
  const fontSize = size === 'sm' ? 14 : size === 'lg' ? 28 : 18;
  const labelSize = size === 'sm' ? 7 : size === 'lg' ? 11 : 9;

  return (
    <div className="flex flex-col items-center">
      <svg width={dim} height={dim / 2 + strokeWidth} viewBox={`0 0 ${dim} ${dim / 2 + strokeWidth}`}>
        {/* Background arc */}
        <path
          d={`M ${strokeWidth / 2} ${dim / 2} A ${radius} ${radius} 0 0 1 ${dim - strokeWidth / 2} ${dim / 2}`}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d={`M ${strokeWidth / 2} ${dim / 2} A ${radius} ${radius} 0 0 1 ${dim - strokeWidth / 2} ${dim / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        {/* Score text */}
        <text x={dim / 2} y={dim / 2 - 2} textAnchor="middle" fill={color} fontSize={fontSize} fontWeight="bold">
          {score}
        </text>
      </svg>
      <span
        className="font-semibold tracking-wider mt-0.5"
        style={{ fontSize: labelSize, color }}
      >
        {level}
      </span>
    </div>
  );
}
