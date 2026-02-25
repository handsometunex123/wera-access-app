
// Estate background SVG as a React component
const EstateBg = () => (
  <svg className="estate-bg" viewBox="0 0 1440 180" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
    <rect width="1440" height="180" fill="url(#estate-gradient)" />
    <g opacity="0.7">
      <ellipse cx="200" cy="160" rx="120" ry="30" fill="#a7f3d0" />
      <ellipse cx="1240" cy="170" rx="100" ry="22" fill="#bae6fd" />
      <ellipse cx="700" cy="170" rx="180" ry="40" fill="#fef9c3" />
      <ellipse cx="500" cy="170" rx="80" ry="18" fill="#f3e8ff" />
      <ellipse cx="1000" cy="160" rx="120" ry="30" fill="#bbf7d0" />
    </g>
    <g>
      <rect x="300" y="120" width="60" height="40" rx="8" fill="#f1f5f9" stroke="#a7f3d0" strokeWidth="2" />
      <rect x="370" y="135" width="30" height="25" rx="6" fill="#e0e7ff" stroke="#818cf8" strokeWidth="1.5" />
      <rect x="410" y="130" width="40" height="30" rx="7" fill="#fef9c3" stroke="#fde68a" strokeWidth="1.5" />
      <rect x="1100" y="130" width="50" height="35" rx="7" fill="#f1f5f9" stroke="#bae6fd" strokeWidth="2" />
      <rect x="1160" y="140" width="30" height="20" rx="5" fill="#e0e7ff" stroke="#818cf8" strokeWidth="1.5" />
      <rect x="1200" y="135" width="35" height="25" rx="6" fill="#fef9c3" stroke="#fde68a" strokeWidth="1.5" />
    </g>
    <defs>
      <linearGradient id="estate-gradient" x1="0" y1="0" x2="1440" y2="180" gradientUnits="userSpaceOnUse">
        <stop stopColor="#e0f7ef" />
        <stop offset="0.7" stopColor="#f8fafc" />
        <stop offset="1" stopColor="#e0e7ff" />
      </linearGradient>
    </defs>
  </svg>
);

export default EstateBg;
