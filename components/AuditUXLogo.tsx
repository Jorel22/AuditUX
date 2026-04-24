import React from 'react';
import Image from 'next/image';

const AuditUXLogo = ({ className }: { className?: string }) => (
  <div className={className}>
    <img
      src="/logo-auditux.svg"
      alt="AuditUX Logo"
      style={{ width: '100%', height: 'auto' }}
    />
  </div>
);

export default AuditUXLogo;