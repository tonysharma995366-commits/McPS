import React from 'react';

/**
 * Route transition wrapper with lightweight 120ms fade-in.
 */
export default function PageWrapper({ children }) {
  return <div className="page-enter">{children}</div>;
}
