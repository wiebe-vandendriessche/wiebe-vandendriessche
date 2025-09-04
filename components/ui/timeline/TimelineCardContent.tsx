import React from "react";
import Image from "next/image";
import { Badge } from "../badge";
import { getCardForeground } from "./timelineStyles";

export type TimelineElement = {
  date: string;
  title: string;
  subtitle: string;
  description: string;
  description_ext?: string;
  image_ext?: string[];
  tags?: string[];
  logos?: string[];
  order?: number; // optional ordering (not currently displayed)
};

const TimelineCardContent: React.FC<{
  item: TimelineElement;
  textColor?: string;
}> = ({ item, textColor }) => (
  <div style={{ color: textColor || getCardForeground() }} className="relative">
    <div>
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
      {item.tags && item.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.tags.map((tag: string, i: number) => (
            <Badge key={i} variant="secondary" className="text-sm">{tag}</Badge>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default TimelineCardContent;
