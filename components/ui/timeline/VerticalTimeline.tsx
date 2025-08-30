import React from "react";

export interface VerticalTimelineProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  layout?: '2-columns' | '1-column-left' | '1-column' | '1-column-right';
  lineColor?: string;
}

const VerticalTimeline: React.FC<VerticalTimelineProps> = ({
  animate = true,
  className = '',
  layout = '2-columns',
  lineColor = '#FFF',
  children,
}) => {
  return (
    <div
      className={[
        className,
        'vertical-timeline',
        'relative',
        'mx-auto',
        'w-[95%]',
        'max-w-[1170px]',
        'py-8',
        animate ? 'vertical-timeline--animate' : '',
        layout === '2-columns' ? 'vertical-timeline--two-columns' : '',
        layout === '1-column' || layout === '1-column-left' ? 'vertical-timeline--one-column-left' : '',
        layout === '1-column-right' ? 'vertical-timeline--one-column-right' : '',
      ].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
};

export default VerticalTimeline;
