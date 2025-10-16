"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import '@/components/ui/timeline/VerticalTimeline.css';
import '@/components/ui/timeline/VerticalTimelineElement.css';
import TimelineSection from './TimelineSection';
import { Briefcase, GraduationCap, Ellipsis } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { TimelineElement } from './TimelineCardContent';
import type { TimelineType } from './types';

const TimelineClient: React.FC<{
  workExperience: TimelineElement[];
  education: TimelineElement[];
  hobbies: TimelineElement[];
}> = ({ workExperience, education, hobbies }) => {
  useEffect(() => { console.log('TimelineClient mounted'); }, []);
  const [activeSection, setActiveSection] = useState<'all' | TimelineType>('all');
  const t = useTranslations();

  const sectionMap = {
    workExperience: { data: workExperience, icon: <Briefcase className="w-5 h-5" /> },
    education: { data: education, icon: <GraduationCap className="w-5 h-5" /> },
    hobbies: { data: hobbies, icon: <Ellipsis className="w-5 h-5" /> },
  } as const;

  const tabLabels: Record<string, string> = {
    all: 'Timeline.allLabel',
    workExperience: 'Timeline.workExperienceLabel',
    education: 'Timeline.educationLabel',
    hobbies: 'Timeline.hobbiesLabel',
  };

  return (
    <section className="relative w-full max-w-4xl mx-auto px-4 flex flex-col items-center">
      <div className="foggy-gradient-bg absolute inset-0 -z-10 pointer-events-none" />
      <div className="relative z-10 w-full flex flex-col items-center overflow-x-hidden">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">{t('Timeline.title')}</h1>
        <Tabs value={activeSection} onValueChange={(v) => setActiveSection(v as any)} className="w-full">
          <div className="flex justify-center mb-4">
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

export default TimelineClient;
