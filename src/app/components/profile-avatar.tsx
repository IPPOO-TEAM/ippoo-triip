interface ProfileAvatarProps {
  initials: string;
  /** Vraie photo de profil du compte (user.avatarUrl). Si absente, on affiche
   *  un cercle d'initiales — jamais une photo générique. */
  photoUrl?: string | null;
  size?: number;
  className?: string;
  gradient?: string;
  textClass?: string;
}

/** Avatar réutilisable : affiche la photo réelle du compte si elle existe,
 *  sinon un cercle d'initiales coloré. Aucune image générique par défaut. */
export function ProfileAvatar({
  initials, photoUrl, size = 44, className = "",
  gradient = "from-[#F77F00] to-amber-400", textClass = "text-white text-xs",
}: ProfileAvatarProps) {
  return (
    <div className={`rounded-full overflow-hidden flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      {photoUrl ? (
        <img src={photoUrl} alt={initials} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <span className={textClass}>{initials}</span>
        </div>
      )}
    </div>
  );
}
