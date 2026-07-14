interface Props { size?: number; light?: boolean; }

export default function GtecLogo({ size = 44, light = false }: Props) {
  const width = Math.round(size * 1.5); // maintain the ~3:2 rectangular aspect ratio
  return (
    <img
      src="/logo.png"
      alt="GTEC Logo"
      width={width}
      height={size}
      onError={(e) => {
        // Fallback: hide broken-image icon but keep space reserved so layout is stable
        (e.target as HTMLImageElement).style.visibility = 'hidden';
      }}
      style={{
        objectFit: 'contain',
        display: 'block',
        minWidth: width,
        minHeight: size,
        filter: light
          ? 'drop-shadow(0px 2px 6px rgba(0,0,0,0.6)) brightness(1.05)'
          : 'none',
      }}
    />
  );
}
