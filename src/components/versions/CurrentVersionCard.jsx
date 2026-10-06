import React from "react";
import { Layers, ArrowUpCircle } from "lucide-react";
import Card from "../Card.jsx";

export default function CurrentVersionCard({ current, updates }) {
  const version = current?.version || "1.20.4";
  const build = current?.build || "—";
  const updateAvailable = updates?.updateAvailable;
  const latestVersion = updates?.latestVersion;

  return (
    <Card className="mb-3 select-none">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-[#4ade80]/15 flex items-center justify-center shrink-0">
            <Layers size={22} className="text-[#4ade80]" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-[#e5e7eb]">
              Paper {version}
            </h3>
            <p className="text-[12px] text-[#9ca3af] mt-0.5">
              Build #{build} · Java 17 · PaperMC
            </p>
          </div>
        </div>

        {updateAvailable && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#4ade80]/15 border border-[#4ade80]/30 text-[#4ade80] text-[11.5px] font-medium">
            <ArrowUpCircle size={14} />
            <span>Update: {latestVersion}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
