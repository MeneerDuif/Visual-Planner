import React from 'react';
import { TimelineEvent, EventCategory } from '../types';
import { formatDateDisplay } from '../utils/dateUtils';
import { X, CheckCircle2, Circle, Calendar, Star, Info } from 'lucide-react';

interface EventDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  events: TimelineEvent[];
  category: EventCategory;
  title: string;
  onToggleComplete?: (event: TimelineEvent) => void;
  onEventClick: (event: TimelineEvent) => void;
}

export const EventDrawer: React.FC<EventDrawerProps> = ({
  isOpen,
  onClose,
  events,
  category,
  title,
  onToggleComplete,
  onEventClick
}) => {
  if (!isOpen) return null;

  const filteredEvents = events
    .filter(e => e.category === category)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const completedCount = filteredEvents.filter(t => t.isCompleted).length;
  const totalCount = filteredEvents.length;

  const isTodo = category === EventCategory.TODO;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-[1px] animate-in fade-in duration-200" 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-5 border-b flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {category === EventCategory.MILESTONE && <Star className="text-amber-500" size={24} fill="currentColor" />}
                {category === EventCategory.TODO && <CheckCircle2 className="text-blue-500" size={24} />}
                {title}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
                {isTodo 
                    ? `${completedCount}/${totalCount} completed` 
                    : `${totalCount} items`
                }
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
            {filteredEvents.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <Info size={48} className="mb-4 opacity-20" />
                    <p>No {title.toLowerCase()} yet.</p>
                    <p className="text-xs mt-2">Add events to the timeline to see them here.</p>
                </div>
            )}

            {filteredEvents.map(event => (
                <div 
                    key={event.id} 
                    className={`
                        group flex items-start p-4 rounded-xl border transition-all duration-200 cursor-pointer
                        ${event.isCompleted && isTodo
                            ? 'bg-slate-50 border-slate-200 opacity-75' 
                            : 'bg-white border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-md'
                        }
                    `}
                    onClick={() => onEventClick(event)}
                >
                    {isTodo ? (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleComplete?.(event);
                            }}
                            className={`
                                mt-0.5 mr-4 flex-shrink-0 transition-colors
                                ${event.isCompleted 
                                    ? 'text-green-500 hover:text-green-600' 
                                    : 'text-slate-300 hover:text-blue-500'
                                }
                            `}
                        >
                            {event.isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                        </button>
                    ) : (
                        <div className="mt-0.5 mr-4 flex-shrink-0 text-amber-500">
                            <Star size={20} fill={event.category === EventCategory.MILESTONE ? "currentColor" : "none"} />
                        </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <h3 
                                className={`font-medium text-sm sm:text-base transition-all ${
                                    event.isCompleted && isTodo ? 'line-through text-slate-500' : 'text-slate-800'
                                }`}
                            >
                                {event.title}
                            </h3>
                        </div>
                        
                        {event.description && (
                            <p className={`text-xs mt-1 transition-colors ${event.isCompleted && isTodo ? 'text-slate-400' : 'text-slate-500'}`}>
                                {event.description}
                            </p>
                        )}
                        
                        <div className="flex items-center mt-3 text-xs text-slate-400 font-medium">
                             <Calendar size={12} className="mr-1.5" />
                             {formatDateDisplay(event.date)}
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};