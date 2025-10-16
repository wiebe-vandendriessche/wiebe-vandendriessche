import React, { CSSProperties, MouseEventHandler } from 'react';
import { useInView } from 'react-intersection-observer';
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription } from "../card";
import { Button } from "../button";
import { Calendar, ArrowRight } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "../dialog";
import TimelinePopupContent from "./TimelinePopupContent";
import TimelineCardContent from "./TimelineCardContent";
import { DialogDescription } from '@radix-ui/react-dialog';

export interface VerticalTimelineElementProps {
    children?: React.ReactNode;
    item?: any;
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

const VerticalTimelineElement: React.FC<VerticalTimelineElementProps> = ({
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
    item,
}) => {
    const [open, setOpen] = React.useState(false);
    const { ref, inView } = useInView({ rootMargin: '0px 0px -40px 0px', triggerOnce: true });
    const showAnim = inView || visible;
    let cardInitial = position === 'right' ? { opacity: 0, x: 100 } : { opacity: 0, x: -100 };
    let cardAnimate = { opacity: 1, x: 0 };
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
            <motion.div
                initial={cardInitial}
                animate={showAnim ? cardAnimate : cardInitial}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
                <Card
                    style={{ ...contentStyle }}
                    onClick={onTimelineElementClick}
                    className={[
                        textClassName,
                        'vertical-timeline-element-content',
                        'gap-1',
                    ].filter(Boolean).join(' ')}
                >
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-bold h-3 mt-2">
                            <Calendar size={16} className="mr-1" />
                            {date && (
                                <span className={[dateClassName, 'vertical-timeline-element-date', 'opacity-70 text-sm'].filter(Boolean).join(' ')}>
                                    {date}
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardDescription>
                        {item ? <TimelineCardContent item={item} /> : children}
                    </CardDescription>
                    <div className="flex gap-2 mt-2">
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="flex items-center gap-1" onClick={() => setOpen(true)}>
                                    Details <ArrowRight size={14} />
                                </Button>
                            </DialogTrigger>
                            <DialogContent large style={{ ...contentStyle }} aria-describedby={undefined}>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 font-bold">
                                        <Calendar size={16} className="mr-1" />
                                        {date && (
                                            <span className={[dateClassName, 'vertical-timeline-element-date', 'opacity-70 text-sm'].filter(Boolean).join(' ')}>
                                                {date}
                                            </span>
                                        )}
                                    </DialogTitle>
                                </DialogHeader>
                                <div>
                                    {typeof item !== 'undefined' ? <TimelinePopupContent item={item} /> : children}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
};

export default VerticalTimelineElement;
