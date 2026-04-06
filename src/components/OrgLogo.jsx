import React, { useState } from 'react';
import './OrgLogo.css';





const OrgLogo = ({ spoId, spoName, spoInfo, size = 28, variant = 'square', className = '' }) => {
  const [imgError, setImgError] = useState(false);
  const info = spoInfo?.[spoId];
  const logoUrl = info?.logo;
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

  // Fallback: empty white block (initials removed as they can be confusing)
  const bg = '#ffffff';

  return (
    <div
      className={`org-logo org-logo--initials org-logo--${variant} ${className}`}
      style={{ ...containerStyle, backgroundColor: bg }}
      title={spoName}
    >
      {/* Intentionally left empty as abbreviations can be confusing */}
    </div>
  );
};

export default OrgLogo;
