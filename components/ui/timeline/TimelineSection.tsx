import React from "react";
import TimelineCardContent from "./TimelineCardContent";
import timelineStyles from "./timelineStyles";
import { TimelineElement } from "./TimelineCardContent";
import { TimelineType } from "./types";
import VerticalTimeline from "./VerticalTimeline";
import VerticalTimelineElement from "./VerticalTimelineElement";

const sectionTitleKey: Record<TimelineType, string> = {
  workExperience: 'Timeline.workExperienceLabel',
  education: 'Timeline.educationLabel',
  hobbies: 'Timeline.hobbiesLabel',
};

const TimelineSection: React.FC<{
  type: TimelineType;
  data: TimelineElement[];
  icon: React.ReactElement;
  t: any;
}> = ({ type, data, icon, t }) => {
  if (!data?.length) return null;
  const style = timelineStyles[type];
  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-4">{t(sectionTitleKey[type])}</h2>
      <VerticalTimeline
        layout={style.position === 'right' ? '1-column-right' : '1-column-left'}
        lineColor={style.lineColor}
      >
        {data.map((item, index) => (
          <VerticalTimelineElement
            key={index}
            contentStyle={style.cardStyle()}
            contentArrowStyle={{ display: "none" }}
            iconStyle={style.iconStyle}
            date={item.date}
            icon={icon}
            position={style.position === 'right' ? 'right' : 'left'}
            item={item}
          />
        ))}
      </VerticalTimeline>
    </div>
  );
};

export default TimelineSection;
