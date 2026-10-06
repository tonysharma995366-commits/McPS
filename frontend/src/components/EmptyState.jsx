import React from "react";

export function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="text-center py-12 select-none">
      {Icon && <Icon className="w-8 h-8 text-[#6b7280] mx-auto mb-3" />}
      <p className="text-[14px] text-[#9ca3af] font-medium">{title}</p>
      {subtitle && (
        <p className="text-[12px] text-[#6b7280] mt-1">{subtitle}</p>
      )}
    </div>
  );
}

export default EmptyState;
