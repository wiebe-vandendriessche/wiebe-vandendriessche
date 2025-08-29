"use client";

import React, { useState } from 'react';
import { useEffect } from 'react';
import Image from 'next/image';
import { useMessages } from 'next-intl';


// Type definitions
// Unified timeline element type coming from Supabase (see i18n/request.ts)
type TimelineElement = {
  date: string;
  title: string;
  subtitle: string;
  description: string;
  tags?: string[];
  logos?: { src: string; className?: string }[];
};

type TimelineType = 'workExperience' | 'education' | 'hobbies';

import {
  VerticalTimeline,
  VerticalTimelineElement,
} from '@/components/ui/vertical-timeline';
import {
} from '@heroicons/react/24/solid';
import { Briefcase, GraduationCap, Pencil, Trash2, Share2, Ellipsis } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Use CSS variables for colors
const getCardBackground = () => 'var(--card)';
const getCardForeground = () => 'var(--card-foreground)';
const getPrimary = () => 'var(--primary)';
const getPrimaryForeground = () => 'var(--primary-foreground)';
const getSecondary = () => 'var(--secondary)';
const getSecondaryForeground = () => 'var(--secondary-foreground)';

// All data now fetched dynamically from i18n messages (Timeline.*)
// and injected server-side via i18n/request.ts using Supabase unified table.
const useTimelineData = () => {
  const messages: any = useMessages();
  const tl = messages?.Timeline || {};
  return {
    workExperience: (tl.workExperience as TimelineElement[]) || [],
    education: (tl.education as TimelineElement[]) || [],
    hobbies: (tl.hobbies as TimelineElement[]) || [],
  };
};

// Timeline styles
const timelineStyles: Record<TimelineType, {
  lineColor: string;
  cardStyle: () => React.CSSProperties;
  iconStyle: React.CSSProperties;
  position: string;
}> = {
  workExperience: {
    lineColor: 'var(--border)',
    cardStyle: () => ({
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      padding: '20px',
    }),
    iconStyle: { background: getSecondary(), color: getPrimary() },
    position: 'right',
  },
  education: {
    lineColor: 'var(--border)',
    cardStyle: () => ({
      boxShadow: '0 5px 10px rgba(0,0,0,0.05)',
      padding: '20px',
    }),
    iconStyle: { background: getSecondary(), color: getPrimary()  },
    position: 'left',
  },
  hobbies: {
    lineColor: 'var(--border)',
    cardStyle: () => ({
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      padding: '20px',
    }),
    iconStyle: { background: getSecondary(), color: getPrimary() },
    position: 'right',
  },
};


// Content Renderer

const renderCardContent = (
  item: TimelineElement,
  type: TimelineType,
  bgColor: string
) => {
  const textColor = getCardForeground();
  return (
    <div style={{ color: textColor }} className="relative">
      {/* Card Content */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">{item.title}</h3>
            <h4 className="text-sm opacity-80">{item.subtitle}</h4>
          </div>
          {/* Logos for any timeline entry type */}
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
      </div>
    </div>
  );
};

// Timeline Renderer
const renderTimeline = (
  type: TimelineType,
  data: TimelineElement[],
  icon: React.ReactElement
) => {
  if (!data?.length) return null;
  const style = timelineStyles[type];

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-4">
        {type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1')}
      </h2>
      <VerticalTimeline
        layout={style.position === 'right' ? '1-column-right' : '1-column-left'}
        lineColor={style.lineColor}
      >
        {data.map((item, index) => {
          const cardStyle = style.cardStyle();
          return (
            <VerticalTimelineElement
              key={index}
              contentStyle={cardStyle}
              contentArrowStyle={{ display: "none" }}
              iconStyle={style.iconStyle}
              date={item.date}
              icon={icon}
              position={style.position === 'right' ? 'right' : 'left'}
            >
              {renderCardContent(item, type, String(cardStyle.background))}
            </VerticalTimelineElement>
          );
        })}
      </VerticalTimeline>
    </div>
  );
};

// Component
const TimelinePage = () => {
  useEffect(() => {
    console.log('TimelinePage rendered');
  });
  const [activeSection, setActiveSection] = useState<'all' | TimelineType>('all');
  const { workExperience, education, hobbies } = useTimelineData();

  const sectionMap = {
    workExperience: {
      data: workExperience,
      icon: <Briefcase className="w-5 h-5" />,
    },
    education: {
      data: education,
      icon: <GraduationCap className="w-5 h-5" />,
    },
    hobbies: {
      data: hobbies,
      icon: <Ellipsis className="w-5 h-5" />,
    },
  };

  return (
    <section className="relative w-full max-w-4xl mx-auto px-4 py-5 flex flex-col items-center">
      {/* Blurry gradient background as very first child, absolutely positioned and behind all content */}
      <div className="foggy-gradient-bg absolute inset-0 -z-10 pointer-events-none" />
      {/* ...existing code... */}
      <div className="relative z-10 w-full flex flex-col items-center overflow-x-hidden">

        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
          Timeline
        </h1>


        <Tabs
          defaultValue="all"
          value={activeSection}
          onValueChange={(value) => setActiveSection(value as 'all' | TimelineType)}
          className="w-full"
        >
          <div className="flex justify-center mb-6">
            <TabsList className="gap-1 sm:gap-3">
              {['all', ...Object.keys(sectionMap)].map((section) => (
                <TabsTrigger key={section} value={section}>
                  {section.charAt(0).toUpperCase() + section.slice(1).replace(/([A-Z])/g, ' $1')}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <TabsContent value="all">
            {renderTimeline('workExperience', workExperience, sectionMap.workExperience.icon)}
            {renderTimeline('education', education, sectionMap.education.icon)}
            {renderTimeline('hobbies', hobbies, sectionMap.hobbies.icon)}
          </TabsContent>
          {(Object.keys(sectionMap) as Array<keyof typeof sectionMap>).map((section) => (
            <TabsContent key={section} value={section} className="animate-flyin">
              {renderTimeline(
                section,
                sectionMap[section].data,
                sectionMap[section].icon
              )}
            </TabsContent>
          ))}
        </Tabs>



      </div>
    </section >
  );
};

export default TimelinePage;