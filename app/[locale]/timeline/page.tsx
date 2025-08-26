"use client";

import React, { useState } from 'react';
import { useEffect } from 'react';


// Type definitions
type WorkExperience = {
  date: string;
  title: string;
  subtitle: string;
  description: string;
  skills: string[];
};
type Education = {
  date: string;
  title: string;
  subtitle: string;
  description: string;
  topics: string[];
};
// OtherItem type already defined above, remove duplicate

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

// Use CSS variables for colors
const getCardBackground = () => 'var(--card)';
const getCardForeground = () => 'var(--card-foreground)';
const getPrimary = () => 'var(--primary)';
const getPrimaryForeground = () => 'var(--primary-foreground)';
const getSecondary = () => 'var(--secondary)';
const getSecondaryForeground = () => 'var(--secondary-foreground)';

// Data
type HobbiesItem = {
  date: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
};

const hobbiesData: HobbiesItem[] = [
  {
    date: '2020',
    title: 'Saxophone Specialisation Classical Music',
    subtitle: 'Art\'iz Music Academy',
    description: 'Received specialisation certification in classical saxophone music from Art\'iz Music Academy.',
    tags: ['Saxophone', 'Music', 'Classical', 'Certification'],
  },
  {
    date: '2016 – 2020',
    title: 'Youth Animator',
    subtitle: 'Youth Movement KSA Izegem',
    description: 'Volunteered as a youth animator, organizing activities, leading groups, and fostering community spirit in KSA Izegem.',
    tags: ['Youth Animator', 'Leadership', 'Community', 'Volunteering', 'KSA'],
  },
  {
    date: '2020',
    title: 'Lifeguard Certification',
    subtitle: '',
    description: 'Achieved official Lifeguard certification, enabling work in public pools.',
    tags: ['Certification', 'Lifeguard', 'Safety'],
  },
  {
    date: '2019 – Present',
    title: 'Architectural School (Hobby)',
    subtitle: '',
    description: 'Pursued architectural studies as a hobby, learning about building design and construction.',
    tags: ['Architecture', 'Design', 'Hobby'],
  },
  {
    date: '2018 – Present',
    title: 'Graphics School (Hobby)',
    subtitle: '',
    description: 'Attended graphics school as a hobby, exploring design and visual arts.',
    tags: ['Graphics', 'Design', 'Art'],
  },
  {
    date: '2018',
    title: 'Built My First Computer',
    subtitle: '',
    description: 'Built my first custom PC from scratch, learning about hardware and assembly.',
    tags: ['DIY', 'PC Building', 'Hardware'],
  },
];
const workExperienceData: WorkExperience[] = [
  {
    date: 'Planned: 2025+',
    title: 'PhD Researcher & Teaching Assistant',
    subtitle: 'Ghent University (UGent)',
    description: 'PhD trajectory in Information Engineering Technology, assisting with university courses, conducting research, writing academic papers, and attending international conferences.',
    skills: ['Teaching', 'Research', 'Academic Writing', 'Conferences', 'Information Engineering Technology'],
  },
  {
    date: 'Summer 2024',
    title: 'DevOps Engineer Intern',
    subtitle: 'Skyline Communications',
    description: 'Developed an Integration Test Boundary Manager in .NET to help DevOps engineers efficiently navigate test environments and configure boundaries for integration tests.',
    skills: ['.NET', 'DevOps', 'Automation', 'C#'],
  },
  {
    date: 'Summer 2021 – Summer 2024',
    title: 'Lifeguard',
    subtitle: 'Krekel Swimming Pool Izegem',
    description: 'Worked as a certified lifeguard at Krekel Swimming Pool Izegem for four consecutive summers, ensuring safety and providing first aid.',
    skills: ['Lifeguard', 'First Aid', 'Safety'],
  },
  {
    date: 'Summer 2020',
    title: 'Assistant',
    subtitle: 'Bekafun BVBA',
    description: 'Assisted with logistics, customer service, and technical support at Bekafun BVBA during the summer.',
    skills: ['Logistics', 'Customer Service', 'Technical Support'],
  },
];

const educationData: Education[] = [
  {
    date: 'Planned: 2025+',
    title: 'PhD in Information Engineering Technology',
    subtitle: 'Ghent University (UGent)',
    description: 'Planned doctoral trajectory in Information Engineering Technology.',
    topics: ['Academic Writing', 'Conferences', 'Research'],
  },
  {
    date: '2025',
    title: 'Master’s Thesis: AIBoMGen',
    subtitle: 'Ghent University (UGent)',
    description: 'Development of a tool to generate AI Bills of Materials (AIBoMs), tracking training data, model dependencies, and compliance with the EU AI Act.',
    topics: ['AI Transparency', 'Compliance', 'Software Development'],
  },
  {
    date: '2024 – 2025',
    title: 'Master in Information Engineering Technology',
    subtitle: 'Ghent University (UGent)',
    description: 'Master program focused on AI, system design, and cyber security.',
    topics: ['Cyber Security', 'System Design', 'Machine Learning', 'Blockchain', 'Computer Graphics'],
  },
  {
    date: '2021 – 2024',
    title: 'Bachelor in Information Engineering Technology',
    subtitle: 'Ghent University (UGent)',
    description: 'Bachelor program with emphasis on computer science, software development, and mathematics.',
    topics: ['Computer Science', 'General Sciences', 'Mathematics', 'Programming'],
  },
  {
    date: '2017 – 2021',
    title: 'General Secondary Education: Mathematics-Science',
    subtitle: 'Prizma Campus College Izegem',
    description: 'ASO Secondary education with a focus on mathematics and science.',
    topics: ['Mathematics', 'Science'],
  },
  {
    date: '2015 – 2017',
    title: 'Start General Secondary Education: Latin',
    subtitle: 'Prizma Middenschool Izegem',
    description: 'Start of ASO secondary education with a focus on Latin.',
    topics: ['Latin', 'Mathematics'],
  },
];

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
      background: getCardBackground(),
      color: getCardForeground(),
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      padding: '16px',
      marginLeft: '20px',
    }),
    iconStyle: { background: getSecondary(), color: getSecondaryForeground() },
    position: 'right',
  },
  education: {
    lineColor: 'var(--border)',
    cardStyle: () => ({
      background: getCardBackground(),
      color: getCardForeground(),
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 5px 10px rgba(0,0,0,0.05)',
      padding: '20px',
    }),
    iconStyle: { background: getSecondary(), color: getSecondaryForeground() },
    position: 'left',
  },
  hobbies: {
    lineColor: 'var(--border)',
    cardStyle: () => ({
      background: getCardBackground(),
      color: getCardForeground(),
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      padding: '16px',
      marginLeft: '20px',
    }),
    iconStyle: { background: getSecondary(), color: getSecondaryForeground() },
    position: 'right',
  },
};

// Action Handlers (Dummy implementations)


// Content Renderer

const renderCardContent = (
  item: WorkExperience | Education | HobbiesItem,
  type: TimelineType,
  bgColor: string
) => {
  const textColor = getCardForeground();
  return (
    <div style={{ color: textColor }} className="relative">
      {/* Card Content */}
      <div>
        <h3 className="text-xl font-bold">{item.title}</h3>
        <h4 className="text-sm opacity-80">{item.subtitle}</h4>
        <p className="mt-2">{item.description}</p>
        {type === 'workExperience' && 'skills' in item && item.skills && (
          <div className="mt-3 flex flex-wrap gap-2">
            {item.skills.map((skill: string, i: number) => (
              <Badge key={i} variant="secondary" className="text-sm">{skill}</Badge>
            ))}
          </div>
        )}
        {type === 'education' && 'topics' in item && item.topics && (
          <div className="mt-3 flex flex-wrap gap-2">
            {item.topics.map((topic: string, i: number) => (
              <Badge key={i} variant="secondary" className="text-sm">{topic}</Badge>
            ))}
          </div>
        )}
        {type === 'hobbies' && 'tags' in item && item.tags && (
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
  data: (WorkExperience | Education | HobbiesItem)[],
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

  const sectionMap = {
    workExperience: {
      data: workExperienceData,
      icon: <Briefcase className="w-5 h-5" />,
    },
    education: {
      data: educationData,
      icon: <GraduationCap className="w-5 h-5" />,
    },
    hobbies: {
      data: hobbiesData,
      icon: <Ellipsis className="w-5 h-5" />,
    },
  };

  return (
    <section className="relative w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center scroll-smooth">
      {/* Blurry gradient background as very first child, absolutely positioned and behind all content */}
      <div className="foggy-gradient-bg absolute inset-0 -z-10 pointer-events-none" />
      {/* ...existing code... */}
      <div className="relative z-10 w-full flex flex-col items-center">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
          Timeline
        </h1>
        {/* Filter Buttons */}
        <div className="flex justify-center gap-2 flex-wrap mb-8">
          {[...Object.keys(sectionMap), 'all'].map((section) => (
            <Button
              key={section}
              onClick={() => setActiveSection(section as TimelineType | 'all')}
              variant={activeSection === section ? 'default' : 'outline'}
            >
              {section.charAt(0).toUpperCase() + section.slice(1).replace(/([A-Z])/g, ' $1')}
            </Button>
          ))}
        </div>
        {/* Timeline Sections */}
        <div className="w-full">
          {/* Fly-in animation on section switch */}
          <div
            key={activeSection}
            className="animate-flyin"
          >
            {activeSection === 'all' ? (
              <>
                {renderTimeline('workExperience', workExperienceData, sectionMap.workExperience.icon)}
                {renderTimeline('education', educationData, sectionMap.education.icon)}
                {renderTimeline('hobbies', hobbiesData, sectionMap.hobbies.icon)}
              </>
            ) : (
              renderTimeline(
                activeSection as 'workExperience' | 'education',
                sectionMap[activeSection as 'workExperience' | 'education']?.data,
                sectionMap[activeSection as 'workExperience' | 'education']?.icon
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TimelinePage;
