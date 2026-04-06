import React, { useState } from 'react';
import { Trophy, GraduationCap, Landmark } from 'lucide-react';
import './OrgLogo.css';

const IconMap = {
  Trophy,
  GraduationCap,
  Landmark
};

const OrgLogo = ({ spoId, spoName, spoInfo, size = 28, variant = 'square', className = '' }) => {
  const [imgError, setImgError] = useState(false);
  const info = spoInfo?.[spoId];
  const logoUrl = info?.logo;
  const iconStr = info?.icon;
  const showImg = logoUrl && !imgError;

  const containerStyle = variant === 'square' ? {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    fontSize: `${Math.max(size * 0.35, 9)}px`,
  } : {}; // Banner relies on CSS

  if (showImg) {
    return (
      <div
        className={`org-logo org-logo--img org-logo--${variant} ${className}`}
        style={containerStyle}
        title={spoName}
      >
        <img
          src={logoUrl}
          alt=""
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback: Read icon from spoinfo or default to Landmark
  const FallbackIcon = (iconStr && IconMap[iconStr]) ? IconMap[iconStr] : Landmark;

  return (
    <div
      className={`org-logo org-logo--fallback org-logo--${variant} ${className}`}
      style={containerStyle}
      title={spoName}
    >
      <div className="org-logo-icon-container">
        <FallbackIcon className="fallback-icon" size={variant === 'banner' ? 48 : size * 0.55} strokeWidth={1.5} />
      </div>
    </div>
  );
};

export default OrgLogo;
