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

type TimelineType = 'workExperience' | 'education';
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import {
  BriefcaseIcon,
  AcademicCapIcon,
  RocketLaunchIcon,
  ClockIcon,
  DocumentIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
} from '@heroicons/react/24/solid';

const colorPalette = [
  '#172554', // dark navy blue
  '#0c4a6e', // dark cyan-blue
  '#064e3b', // deep teal green
  '#78350f', // dark amber-brown
  '#3c096c', // dark indigo-purple
  '#1f2937', // slate black
  '#7f1d1d', // deep crimson red
];


// Deterministic color selection for hydration consistency
const getColorByIndex = (index: number) => colorPalette[index % colorPalette.length];

const getContrastTextColor = () => '#ffffff';

// Data
const workExperienceData: WorkExperience[] = [
// Removed duplicate declaration
  {
    date: 'Jan 2023 - Present',
    title: 'Senior Software Engineer',
    subtitle: 'TechCorp, Silicon Valley',
    description: 'Leading development of AI-driven analytics platform.',
    skills: ['React', 'Node.js', 'TypeScript'],
  },
  {
    date: 'Jun 2020 - Dec 2022',
    title: 'Software Engineer',
    subtitle: 'Innovate Inc., Seattle',
    description: 'Developed scalable microservices architecture.',
    skills: ['Java', 'Spring Boot', 'AWS'],
  },
  {
    date: 'May 2018 - May 2020',
    title: 'Junior Developer',
    subtitle: 'StartUpX, San Francisco',
    description: 'Built responsive web applications.',
    skills: ['HTML', 'CSS', 'JavaScript'],
  },
];

const educationData: Education[] = [
// Removed duplicate declaration
  {
    date: '2014 - 2018',
    title: 'B.S. Computer Science',
    subtitle: 'Stanford University',
    description: 'Graduated with honors, focused on AI and algorithms.',
    topics: ['Data Structures', 'Machine Learning'],
  },
  {
    date: '2020',
    title: 'Online Certification',
    subtitle: 'Coursera',
    description: 'Completed Deep Learning Specialization.',
    topics: ['Neural Networks', 'TensorFlow'],
  },
];


// Timeline styles
const timelineStyles: Record<TimelineType, {
  lineColor: string;
  cardStyle: (index: number) => React.CSSProperties;
  iconStyle: React.CSSProperties;
  position: string;
}> = {
  workExperience: {
    lineColor: '#6b7280',
    cardStyle: (index: number) => ({
      background: getColorByIndex(index),
      color: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.5)',
      padding: '16px',
      marginLeft: '20px',
    }),
    iconStyle: { background: '#0f766e', color: '#fff' },
    position: 'right',
  },
  education: {
    lineColor: '#6b7280',
    cardStyle: (index: number) => ({
      background: getColorByIndex(index),
      color: '#ffffff',
      borderRadius: '10px',
      boxShadow: '0 5px 10px rgba(0,0,0,0.5)',
      padding: '20px',
    }),
    iconStyle: { background: '#6b7280', color: '#fff' },
    position: 'left',
  },
};

// Action Handlers (Dummy implementations)
const handleEdit = (item: WorkExperience | Education) => {
  alert(`Editing: ${item.title}`);
};

const handleDelete = (item: WorkExperience | Education) => {
  alert(`Deleting: ${item.title}`);
};

const handleShare = (item: WorkExperience | Education) => {
  alert(`Sharing: ${item.title}`);
};

// Content Renderer

const renderCardContent = (
  item: WorkExperience | Education,
  type: TimelineType,
  bgColor: string
) => {
  const textColor = getContrastTextColor();
  const skillStyle = {
    backgroundColor: textColor === '#ffffff' ? '#1f2937' : '#d1d5db',
    color: textColor,
    padding: '4px 8px',
    borderRadius: '4px',
  };

  return (
    <div style={{ color: textColor }} className="relative">
      {/* Action Buttons */}
      <div className="absolute top-2 right-2 flex gap-2">
        <button onClick={() => handleEdit(item)} title="Edit">
          <PencilIcon className="w-4 h-4 hover:text-yellow-300" />
        </button>
        <button onClick={() => handleDelete(item)} title="Delete">
          <TrashIcon className="w-4 h-4 hover:text-red-300" />
        </button>
        <button onClick={() => handleShare(item)} title="Share">
          <ShareIcon className="w-4 h-4 hover:text-blue-300" />
        </button>
      </div>

      {/* Card Content */}
      <div>
        <h3 className="text-xl font-bold">{item.title}</h3>
        <h4 className="text-sm opacity-80">{item.subtitle}</h4>
        <p className="mt-2">{item.description}</p>
        {type === 'workExperience' && 'skills' in item && item.skills && (
          <div className="mt-3 flex flex-wrap gap-2">
            {item.skills.map((skill: string, i: number) => (
              <span key={i} style={skillStyle} className="text-sm">
                {skill}
              </span>
            ))}
          </div>
        )}
        {type === 'education' && 'topics' in item && item.topics && (
          <div className="mt-3">
            <h5 className="text-sm font-semibold">Topics Covered:</h5>
            <ul className="list-disc list-inside text-sm">
              {item.topics.map((topic: string, i: number) => (
                <li key={i}>{topic}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// Timeline Renderer
const renderTimeline = (
  type: TimelineType,
  data: WorkExperience[] | Education[],
  icon: React.ReactElement
) => {
  if (!data?.length) return null;
  const style = timelineStyles[type];

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-4 text-black">
        {type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1')}
      </h2>
      <VerticalTimeline
        layout={style.position === 'right' ? '1-column-right' : '1-column-left'}
        lineColor={style.lineColor}
      >
        {data.map((item, index) => {
          const cardStyle = style.cardStyle(index);
          return (
            <VerticalTimelineElement
              key={index}
              contentStyle={cardStyle}
              contentArrowStyle={{ display: "none" }}
              iconStyle={style.iconStyle}
              date={item.date}
              icon={icon}
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
      icon: <BriefcaseIcon className="w-5 h-5" />,
    },
    education: {
      data: educationData,
      icon: <AcademicCapIcon className="w-5 h-5" />,
    },
  };

  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center text-black">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
        Timeline
      </h1>
      {/* Filter Buttons */}
      <div className="flex justify-center gap-2 flex-wrap mb-8">
        {[...Object.keys(sectionMap), 'all'].map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section as TimelineType | 'all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors border shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              activeSection === section
                ? 'bg-primary text-white dark:bg-white dark:text-black'
                : 'bg-gray-100 dark:bg-gray-800 text-black hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {section.charAt(0).toUpperCase() + section.slice(1).replace(/([A-Z])/g, ' $1')}
          </button>
        ))}
      </div>
      {/* Timeline Sections */}
      <div className="w-full">
        {activeSection === 'all' ? (
          <>
            {renderTimeline('workExperience', workExperienceData, sectionMap.workExperience.icon)}
            {renderTimeline('education', educationData, sectionMap.education.icon)}
          </>
        ) : (
          renderTimeline(
            activeSection as 'workExperience' | 'education',
            sectionMap[activeSection as 'workExperience' | 'education']?.data,
            sectionMap[activeSection as 'workExperience' | 'education']?.icon
          )
        )}
      </div>
    </section>
  );
};

export default TimelinePage;
