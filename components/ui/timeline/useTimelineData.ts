import { useMessages } from 'next-intl';
import { TimelineElement } from './TimelineCardContent';

type TimelineType = 'workExperience' | 'education' | 'hobbies';

const useTimelineData = () => {
  const messages: any = useMessages();
  const tl = messages?.Timeline || {};
  return {
    workExperience: (tl.workExperience as TimelineElement[]) || [],
    education: (tl.education as TimelineElement[]) || [],
    hobbies: (tl.hobbies as TimelineElement[]) || [],
  };
};

export type { TimelineType };
export default useTimelineData;
