export default function SapphireLogo({ size = 36, textWhite = false, subtitle = '' }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width={size} height={Math.round(size * 0.92)} viewBox="0 0 52 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Blue parallelogram - top */}
        <polygon points="4,2 38,2 34,20 0,20" fill="#0F52BA"/>
        {/* Teal parallelogram - bottom, offset right */}
        <polygon points="14,24 44,24 40,44 10,44" fill="#98DFEA"/>
        {/* Orange dot */}
        <circle cx="47" cy="44" r="5.5" fill="#FFAF46"/>
      </svg>
      <div>
        <div className={`font-bold leading-none tracking-tight ${textWhite ? 'text-white' : 'text-[#0F52BA]'}`}
          style={{ fontFamily: 'General Sans, Inter, system-ui, sans-serif' }}>
          <span className="font-bold">Sapphire</span>
          <span className="font-normal"> {subtitle || 'Leadership Academy'}</span>
        </div>
      </div>
    </div>
  )
}
