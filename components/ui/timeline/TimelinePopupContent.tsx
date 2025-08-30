import React from "react";


import Image from "next/image";
import { Badge } from "../badge";
import { TimelineElement } from "./TimelineCardContent";
import { getCardForeground } from "./timelineStyles";

interface TimelinePopupContentProps {
  item: TimelineElement;
}

const TimelinePopupContent: React.FC<TimelinePopupContentProps> = ({ item }) => {
  return (
    <div style={{ color: getCardForeground() }} className="p-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">{item.title}</h3>
          <h4 className="text-sm opacity-80">{item.subtitle}</h4>
        </div>
        {Array.isArray(item.logos) && item.logos.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center gap-2 mr-5">
            {item.logos.map((logoUrl, idx) => (
              <Image
                key={idx}
                src={logoUrl}
                alt={`logo-${idx}`}
                width={160}
                height={80}
                className="object-contain logo-darkmode max-w-[110px] w-full h-auto"
              />
            ))}
          </div>
        )}
      </div>
      <p className="mt-2">{item.description}</p>
      {item.description_ext && (
        <div className="mt-2 text-sm opacity-90">
          <strong>Details:</strong>
          <p>{item.description_ext}</p>
        </div>
      )}
      {item.image_ext && (
        <div className="mt-2">
          <Image
            src={item.image_ext}
            alt={item.title + " extra image"}
            width={320}
            height={180}
            className="object-contain rounded shadow max-w-full h-auto"
          />
        </div>
      )}
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
