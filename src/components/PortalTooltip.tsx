import React from "react";
import { createPortal } from "react-dom";

const portalRoot = document.getElementById("portal-root");

export interface PortalTooltipProps {
  children: React.ReactNode;
  style: React.CSSProperties;
}

const PortalTooltip: React.FC<PortalTooltipProps> = ({ children, style }) => {
  if (!portalRoot) return null;
  return createPortal(
    <div className="hour-tooltip" style={style}>
      {children}
    </div>,
    portalRoot
  );
};

export default PortalTooltip;