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
          {/* Render each logo as its own thumbnail box */}
          {Array.isArray(item.logos) && item.logos.length > 0 && (
            // ml-auto pushes the logos block to the right side of the header
            <div className="ml-auto flex flex-col sm:flex-row items-end sm:items-center gap-2">
              {item.logos.map((logoUrl, idx) => (
                <div key={idx} className="w-full sm:w-40 h-20 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center p-1">
                  <Image
                    src={logoUrl}
                    alt={`${item.title} logo-${idx}`}
                    width={500}
                    height={500}
                    priority={false}
                    className="object-contain w-full h-full"
                  />
                </div>
              ))}
            </div>
          )}
      </div>
      <p className="mt-2">{item.description}</p>
      {item.tags && item.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.tags.map((tag: string, i: number) => (
            <Badge key={i} variant="default" className="text-xs">{tag}</Badge>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default TimelineCardContent;
