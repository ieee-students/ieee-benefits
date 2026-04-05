import React from 'react';
import './MetaNav.css';

const MetaNav = () => {
  return (
    <div className="ieee-meta-nav">
      <div className="meta-nav-left">
        <a href="https://www.ieee.org/index.html">IEEE.org</a>
        <span className="divider">|</span>
        <a href="https://www.ieeexplore.ieee.org/Xplore/guesthome.jsp">
          IEEE <em>Xplore</em><sup>®</sup>
        </a>
        <span className="divider">|</span>
        <a href="https://standards.ieee.org/">IEEE Standards</a>
        <span className="divider">|</span>
        <a href="https://spectrum.ieee.org/">IEEE Spectrum</a>
        <span className="divider">|</span>
        <a href="https://www.ieee.org/sitemap.html">More Sites</a>
      </div>
      <div className="meta-nav-right">
        <a href="https://www.ieee.org/membership/join/index.html?WT.mc_id=hc_join">Join IEEE</a>
        <span className="divider">|</span>
        <a href="https://www.ieee.org/give">Donate</a>
      </div>
    </div>
  );
};

export default MetaNav;
