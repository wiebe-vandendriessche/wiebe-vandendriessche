"use client";

import React, { useState } from 'react';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import TimelineSection from '@/components/ui/timeline/TimelineSection';
import useTimelineData, { TimelineType } from '@/components/ui/timeline/useTimelineData';
import '@/components/ui/timeline/VerticalTimeline.css';
import '@/components/ui/timeline/VerticalTimelineElement.css';
import { Briefcase, GraduationCap, Ellipsis } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Component
const TimelinePage = () => {
  useEffect(() => {
    console.log('TimelinePage rendered');
  });
  const [activeSection, setActiveSection] = useState<'all' | TimelineType>('all');
  const { workExperience, education, hobbies } = useTimelineData();
  const t = useTranslations();

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

  // Tab label translation keys
  const tabLabels: Record<string, string> = {
    all: 'Timeline.allLabel',
    workExperience: 'Timeline.workExperienceLabel',
    education: 'Timeline.educationLabel',
    hobbies: 'Timeline.hobbiesLabel',
  };

  return (
    <section className="relative w-full max-w-4xl mx-auto px-4 py-5 flex flex-col items-center">
      <div className="foggy-gradient-bg absolute inset-0 -z-10 pointer-events-none" />
      <div className="relative z-10 w-full flex flex-col items-center overflow-x-hidden">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
          {t('Timeline.title')}
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
                  {t(tabLabels[section])}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <TabsContent value="all">
            <TimelineSection type="workExperience" data={workExperience} icon={sectionMap.workExperience.icon} t={t} />
            <TimelineSection type="education" data={education} icon={sectionMap.education.icon} t={t} />
            <TimelineSection type="hobbies" data={hobbies} icon={sectionMap.hobbies.icon} t={t} />
          </TabsContent>
          {(Object.keys(sectionMap) as Array<keyof typeof sectionMap>).map((section) => (
            <TabsContent key={section} value={section} className="animate-flyin">
              <TimelineSection
                type={section as TimelineType}
                data={sectionMap[section].data}
                icon={sectionMap[section].icon}
                t={t}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
};

export default TimelinePage;