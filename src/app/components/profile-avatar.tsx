import { getAvatar } from "./avatars";

interface ProfileAvatarProps {
  initials: string;
  size?: number;
  className?: string;
  gradient?: string;
  textClass?: string;
}

/** Reusable avatar: shows photo if available, fallback to initials circle */
export function ProfileAvatar({ initials, size = 44, className = "", gradient = "from-[#F77F00] to-amber-400", textClass = "text-white text-xs" }: ProfileAvatarProps) {
  const src = getAvatar(initials);
  return (
    <div className={`rounded-full overflow-hidden flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      {src ? (
        <img src={src} alt={initials} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <span className={textClass}>{initials}</span>
        </div>
      )}
    </div>
  );
}
