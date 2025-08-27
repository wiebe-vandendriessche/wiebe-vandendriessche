
export interface VerticalTimelineProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  layout?: '2-columns' | '1-column-left' | '1-column' | '1-column-right';
  lineColor?: string;
}

export const VerticalTimeline: React.FC<VerticalTimelineProps> = ({
  animate = true,
  className = '',
  layout = '2-columns',
  lineColor = '#FFF',
  children,
}) => {
  // Use CSS variable for line color in styles, do not set it on document.documentElement
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

import "./VerticalTimeline.css";
import React, { CSSProperties, MouseEventHandler } from 'react';
import { useInView } from 'react-intersection-observer';
import "./VerticalTimelineElement.css";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardAction } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { Calendar, Tag, ArrowRight } from "lucide-react";

export interface VerticalTimelineElementProps {
  children?: React.ReactNode;
  className?: string;
  contentArrowStyle?: CSSProperties;
  contentStyle?: CSSProperties;
  date?: React.ReactNode;
  dateClassName?: string;
  icon?: React.ReactNode;
  iconClassName?: string;
  iconOnClick?: MouseEventHandler<HTMLSpanElement>;
  onTimelineElementClick?: MouseEventHandler<HTMLDivElement>;
  iconStyle?: CSSProperties;
  id?: string;
  position?: 'left' | 'right' | '';
  style?: CSSProperties;
  textClassName?: string;
  visible?: boolean;
  shadowSize?: 'small' | 'medium' | 'large';
}

export const VerticalTimelineElement: React.FC<VerticalTimelineElementProps> = ({
  children = '',
  className = '',
  contentArrowStyle = {},
  contentStyle = {},
  date = '',
  dateClassName = '',
  icon = null,
  iconClassName = '',
  iconOnClick,
  onTimelineElementClick,
  iconStyle = {},
  id = '',
  position = '',
  style = {},
  textClassName = '',
  visible = false,
  shadowSize = 'small',
}) => {
  // Intersection observer for animation
  const { ref, inView } = useInView({ rootMargin: '0px 0px -40px 0px', triggerOnce: true });
  const showAnim = inView || visible;
  // Determine fly-in direction for card
  let cardInitial;
  if (position === 'right') {
    cardInitial = { opacity: 0, x: 100 };
  } else {
    cardInitial = { opacity: 0, x: -100 };
  }
  let cardAnimate = { opacity: 1, x: 0 };
  // Icon scale up animation
  let iconInitial = { opacity: 0, scale: 0.5 };
  let iconAnimate = showAnim ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 };
  return (
    <div
      ref={ref}
      id={id}
      className={[
        className,
        'vertical-timeline-element',
        position === 'left' ? 'vertical-timeline-element--left' : '',
        position === 'right' ? 'vertical-timeline-element--right' : '',
        !children ? 'vertical-timeline-element--no-children' : '',
      ].filter(Boolean).join(' ')}
      style={style}
    >
      {/* Icon (Lucide) with Framer Motion */}
      <motion.span
        style={iconStyle}
        onClick={iconOnClick}
        className={[
          iconClassName,
          'vertical-timeline-element-icon',
          `shadow-size-${shadowSize}`,
        ].filter(Boolean).join(' ')}
        initial={iconInitial}
        animate={iconAnimate}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {icon || <Calendar size={24} />}
      </motion.span>
      {/* Content Arrow */}
      <span
        style={contentArrowStyle}
        className="vertical-timeline-element-content-arrow"
      />
      {/* Content as Card with Framer Motion */}
      <motion.div
        initial={cardInitial}
        animate={showAnim ? cardAnimate : cardInitial}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <Card
          style={{ ...contentStyle, borderWidth: 2, borderColor: 'var(--color-primary)' }}
          onClick={onTimelineElementClick}
          className={[
            textClassName,
            'vertical-timeline-element-content',
          ].filter(Boolean).join(' ')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar size={16} className="mr-1" />
              {date && (
                <span className={[dateClassName, 'vertical-timeline-element-date', 'opacity-70 text-sm'].filter(Boolean).join(' ')}>
                  {date}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardDescription>
            {children}
          </CardDescription>
          <div className="flex gap-2 mt-2">
            {/* Example tag */}
            <Badge variant="secondary" className="flex items-center gap-1"><Tag size={12} />Tag</Badge>
            {/* Example action */}
            <Button size="sm" variant="outline" className="flex items-center gap-1">Details <ArrowRight size={14} /></Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
