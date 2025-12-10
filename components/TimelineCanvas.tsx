import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3-scale';
import { TimelineEvent } from '../types';
import { addDays, parseDate, formatDate, formatDateDisplay } from '../utils/dateUtils';
import { ZoomIn, ZoomOut, CheckCircle2, Baby } from 'lucide-react';
import { renderIcon } from '../utils/icons';

interface TimelineCanvasProps {
  events: TimelineEvent[];
  dueDate: Date;
  onEventClick: (event: TimelineEvent) => void;
  onAddEvent: (date: string) => void;
}

const ROW_HEIGHT = 60;
const HEADER_HEIGHT = 50;
const PADDING_TOP = 40; // Increased padding to accommodate the floating due date marker

export const TimelineCanvas: React.FC<TimelineCanvasProps> = ({ events, dueDate, onEventClick, onAddEvent }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(25); // pixels per day

  // Fixed Viewing Window: Dec 1, 2025 to Dec 31, 2028
  const startDate = useMemo(() => new Date('2025-12-01'), []);
  const endDate = useMemo(() => new Date('2028-12-31'), []);
  
  const totalDays = useMemo(() => Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)), [endDate, startDate]);
  
  const totalWidth = totalDays * zoom;

  // Scale: Date -> X Pixel
  const timeScale = useMemo(() => {
    return d3.scaleTime()
      .domain([startDate, endDate])
      .range([0, totalWidth]);
  }, [startDate, endDate, totalWidth]);

  // Separate markers from standard cards
  const markerEvents = useMemo(() => events.filter(e => e.type === 'marker'), [events]);
  const standardEvents = useMemo(() => events.filter(e => e.type !== 'marker'), [events]);

  // Layout Algorithm: Assign rows to avoid overlaps (Only for standard events)
  const processedStandardEvents = useMemo(() => {
    const sorted = [...standardEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const lanes: number[] = []; // Stores the end X position of the last event in each lane

    return sorted.map(event => {
      const x = timeScale(parseDate(event.date));
      const width = 160; // Approximate width of a card
      
      let laneIndex = lanes.findIndex(endX => endX + 10 < x);
      if (laneIndex === -1) {
        laneIndex = lanes.length;
        lanes.push(0);
      }
      
      lanes[laneIndex] = x + width;
      
      return {
        ...event,
        x,
        row: laneIndex
      };
    });
  }, [standardEvents, timeScale]);

  // Calculate container height based on rows needed
  const maxRow = Math.max(...processedStandardEvents.map(e => e.row || 0), 0);
  const totalHeight = HEADER_HEIGHT + PADDING_TOP + (maxRow + 1) * ROW_HEIGHT + 200; // Extra buffer

  // Scroll to Due Date on mount or when scale/date changes
  useEffect(() => {
    if (containerRef.current) {
      const dueX = timeScale(dueDate);
      const clientWidth = containerRef.current.clientWidth;
      containerRef.current.scrollLeft = dueX - clientWidth / 2;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeScale, dueDate]); // Run when scale changes (zoom) or due date changes

  // Generate ticks for the axis
  const dayTicks = useMemo(() => {
      const days = [];
      let current = new Date(startDate);
      while (current <= endDate) {
          days.push(new Date(current));
          current = addDays(current, 1);
      }
      return days;
  }, [startDate, endDate]);

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(5, Math.min(100, prev + delta)));
  };

  const handleContainerClick = (e: React.MouseEvent) => {
      // Allow adding event by clicking on empty space
      if ((e.target as HTMLElement).id === "timeline-track") {
        const rect = containerRef.current!.getBoundingClientRect();
        const clickX = e.clientX - rect.left + containerRef.current!.scrollLeft;
        const clickedDate = timeScale.invert(clickX);
        onAddEvent(formatDate(clickedDate));
      }
  }

  return (
    <div className="relative flex flex-col h-full bg-slate-50 border-t border-slate-200">
        {/* Controls */}
      <div className="absolute top-4 right-4 z-20 flex space-x-2 bg-white p-1 rounded-lg shadow-md border border-slate-200">
        <button onClick={() => handleZoom(-5)} className="p-2 hover:bg-slate-100 rounded-md text-slate-600" title="Zoom Out">
          <ZoomOut size={20} />
        </button>
        <div className="w-px bg-slate-200 my-1"></div>
        <button onClick={() => handleZoom(5)} className="p-2 hover:bg-slate-100 rounded-md text-slate-600" title="Zoom In">
          <ZoomIn size={20} />
        </button>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden relative no-scrollbar cursor-crosshair"
        onClick={handleContainerClick}
      >
        <div 
            id="timeline-track"
            style={{ width: `${totalWidth}px`, height: `${totalHeight}px` }}
            className="relative"
        >
            {/* Axis / Grid */}
            <div className="absolute top-0 left-0 w-full h-[50px] border-b border-slate-300 bg-slate-50/90 backdrop-blur-sm sticky z-10 select-none">
                 {dayTicks.map((day, i) => {
                    const isMonthStart = day.getDate() === 1;
                    const x = timeScale(day);
                    
                    const showDayNumber = zoom >= 20; 
                    const showTick = zoom >= 8;

                    if (!isMonthStart && !showTick) return null;

                    return (
                        <div 
                            key={i} 
                            className={`absolute bottom-0 border-l px-1 text-xs whitespace-nowrap transition-opacity
                                ${isMonthStart ? 'border-slate-400 h-6' : 'border-slate-200 h-3'}
                            `}
                            style={{ left: `${x}px` }}
                        >
                           {isMonthStart ? (
                               <span className="font-bold text-slate-700">
                                   {day.toLocaleDateString('en-GB', { month: 'short' })}
                                   {zoom > 15 && <span className="text-slate-400 font-normal ml-1">{day.getFullYear()}</span>}
                               </span>
                           ) : showDayNumber ? (
                               <span className="text-slate-400 text-[10px]">{day.getDate()}</span>
                           ) : null}
                        </div>
                    )
                 })}
            </div>

            {/* Render Custom Markers (Visual Cues) */}
            {markerEvents.map(event => {
                const x = timeScale(parseDate(event.date));
                return (
                    <React.Fragment key={event.id}>
                         {/* Vertical Line */}
                        <div 
                            className="absolute top-[50px] bottom-0 w-1 pointer-events-none z-0 opacity-80"
                            style={{ 
                                left: `${x}px`,
                                transform: 'translateX(-50%)',
                                background: `linear-gradient(to bottom, ${event.color}, transparent)`
                            }}
                        />
                         {/* Floating Badge */}
                        <div
                            className="absolute top-[26px] z-30 cursor-pointer hover:scale-110 transition-transform"
                            style={{
                                left: `${x}px`,
                                transform: 'translateX(-50%)'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onEventClick(event);
                            }}
                        >
                            <div className="flex flex-col items-center group">
                                <div 
                                    className="p-2 rounded-full shadow-lg border-4 border-slate-50 relative text-white"
                                    style={{ backgroundColor: event.color }}
                                >
                                    {renderIcon(event.icon, { size: 24 })}
                                </div>
                                <div 
                                    className="mt-1 bg-white/90 backdrop-blur text-[11px] font-bold px-3 py-0.5 rounded-full border shadow-sm whitespace-nowrap flex flex-col items-center"
                                    style={{ color: event.color, borderColor: event.color }}
                                >
                                    <span>{event.title}</span>
                                    <span className="text-[9px] font-normal opacity-75">{formatDateDisplay(event.date)}</span>
                                </div>
                            </div>
                        </div>
                    </React.Fragment>
                );
            })}

            {/* Vertical Due Date Marker (Special Case) */}
            <div 
                className="absolute top-[50px] bottom-0 w-1 bg-gradient-to-b from-pink-400 to-pink-200/20 pointer-events-none z-0"
                style={{ 
                    left: `${timeScale(dueDate)}px`,
                    transform: 'translateX(-50%)'
                }}
            />
            <div
                className="absolute top-[26px] z-30 pointer-events-none"
                style={{
                    left: `${timeScale(dueDate)}px`,
                    transform: 'translateX(-50%)'
                }}
            >
                <div className="flex flex-col items-center group">
                     <div className="bg-pink-500 text-white p-2 rounded-full shadow-lg border-4 border-slate-50 relative">
                        <Baby size={24} />
                        <div className="absolute inset-0 rounded-full animate-ping bg-pink-400 opacity-20 duration-1000"></div>
                     </div>
                     <div className="mt-1 bg-white/90 backdrop-blur text-pink-600 text-[11px] font-bold px-3 py-0.5 rounded-full border border-pink-200 shadow-sm whitespace-nowrap">
                        DUE: {formatDateDisplay(dueDate)}
                     </div>
                </div>
            </div>

            {/* Standard Event Cards */}
            {processedStandardEvents.map((event) => (
                <div
                    key={event.id}
                    onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                    }}
                    className={`absolute group transition-all duration-200 cursor-pointer hover:z-20 hover:scale-105 ${event.isCompleted ? 'opacity-75 grayscale-[0.5]' : ''}`}
                    style={{
                        left: `${event.x}px`,
                        top: `${HEADER_HEIGHT + PADDING_TOP + (event.row || 0) * ROW_HEIGHT}px`,
                        width: '150px',
                    }}
                >
                    {/* Visual Line connecting to Date */}
                    <div 
                        className={`absolute h-full w-0.5 bg-slate-300 -top-4 left-0 -z-10 group-hover:bg-slate-400 transition-colors`}
                        style={{ height: `${20}px`}} // Simple connector
                    ></div>

                    {/* Card */}
                    <div 
                        className={`rounded-lg shadow-sm border p-2 text-left relative overflow-hidden flex items-start space-x-2 ${event.isCompleted ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200'}`}
                        style={{ borderLeft: `4px solid ${event.isCompleted ? '#cbd5e1' : event.color}` }}
                    >
                        {event.isCompleted && (
                            <CheckCircle2 size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
                        )}

                        <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold text-xs truncate ${event.isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                {event.title}
                            </h4>
                            <p className="text-[10px] text-slate-500 truncate">{formatDateDisplay(event.date)}</p>
                        </div>
                    </div>
                </div>
            ))}
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-slate-400 text-sm pointer-events-none">
                Scroll to explore • Click empty space to add event
            </div>
        </div>
      </div>
    </div>
  );
};