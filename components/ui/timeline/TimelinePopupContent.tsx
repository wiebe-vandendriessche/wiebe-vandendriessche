import React from "react";


import Image from "next/image";
import { Badge } from "../badge";
import { TimelineElement } from "./TimelineCard";

interface TimelinePopupContentProps {
  item: TimelineElement;
}

const TimelinePopupContent: React.FC<TimelinePopupContentProps> = ({ item }) => {
  return (
    <div className="timeline-popup-content p-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Popup: {item.title}</h3>
          <h4 className="text-sm opacity-80">{item.subtitle}</h4>
        </div>
        {Array.isArray(item.logos) && item.logos.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center gap-2 mr-5">
            {item.logos.map((logo, idx) => (
              <Image
                key={logo.src}
                src={logo.src}
                alt={`logo-${idx}`}
                width={160}
                height={80}
                className={`object-contain logo-darkmode max-w-[110px] w-full h-auto ${logo.className || ''}`}
              />
            ))}
          </div>
        )}
      </div>
      <p className="mt-2">{item.description}</p>
      {item.tags && item.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.tags.map((tag: string, i: number) => (
            <Badge key={i} variant="secondary" className="text-sm">{tag}</Badge>
          ))}
        </div>
      )}
      {/* Add extra information here later */}
    </div>
  );
};

export default TimelinePopupContent;
