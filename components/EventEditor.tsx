import React, { useState, useEffect } from 'react';
import { TimelineEvent, EventCategory, DEFAULT_COLORS, EventType, IconName } from '../types';
import { X, Save, Trash2, Layout, Flag } from 'lucide-react';
import { AVAILABLE_ICONS, renderIcon } from '../utils/icons';

interface EventEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: TimelineEvent) => void;
  onDelete: (id: string) => void;
  initialDate?: string;
  existingEvent?: TimelineEvent | null;
  initialType?: EventType;
}

export const EventEditor: React.FC<EventEditorProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  initialDate, 
  existingEvent,
  initialType = 'standard'
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState<EventCategory>(EventCategory.MILESTONE);
  const [color, setColor] = useState(DEFAULT_COLORS[EventCategory.MILESTONE]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [eventType, setEventType] = useState<EventType>('standard');
  const [selectedIcon, setSelectedIcon] = useState<IconName>('star');

  useEffect(() => {
    if (isOpen) {
      if (existingEvent) {
        setTitle(existingEvent.title);
        setDescription(existingEvent.description);
        setDate(existingEvent.date);
        setCategory(existingEvent.category);
        setColor(existingEvent.color);
        setIsCompleted(!!existingEvent.isCompleted);
        setEventType(existingEvent.type || 'standard');
        setSelectedIcon(existingEvent.icon || 'star');
      } else {
        setTitle('');
        setDescription('');
        setDate(initialDate || new Date().toISOString().split('T')[0]);
        setCategory(EventCategory.TODO);
        setColor(DEFAULT_COLORS[EventCategory.TODO]);
        setIsCompleted(false);
        setEventType(initialType);
        setSelectedIcon('star');
      }
    }
  }, [isOpen, existingEvent, initialDate, initialType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: existingEvent?.id || crypto.randomUUID(),
      title,
      description,
      date,
      category,
      color,
      isCompleted,
      type: eventType,
      icon: selectedIcon
    });
    onClose();
  };

  const handleCategoryChange = (cat: EventCategory) => {
    setCategory(cat);
    setColor(DEFAULT_COLORS[cat]); 
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800">
            {existingEvent ? 'Edit Item' : 'Add New Item'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          
          {/* Visual Style Toggle */}
          <div className="flex p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setEventType('standard')}
              className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
                eventType === 'standard' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Layout size={16} className="mr-2" />
              Standard Card
            </button>
            <button
              type="button"
              onClick={() => setEventType('marker')}
              className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
                eventType === 'marker' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Flag size={16} className="mr-2" />
              Visual Cue
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder={eventType === 'marker' ? "e.g., Baby Shower" : "e.g., Buy Crib"}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
               <select
                 value={category}
                 onChange={(e) => handleCategoryChange(e.target.value as EventCategory)}
                 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
               >
                 {Object.values(EventCategory).map((cat) => (
                   <option key={cat} value={cat}>{cat}</option>
                 ))}
               </select>
            </div>
          </div>

          {/* Icon Picker (Only show for Markers or if desired for Cards later, but primarily for Markers) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
            <div className="grid grid-cols-5 gap-2">
              {AVAILABLE_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`p-2 rounded-lg border flex items-center justify-center transition-all ${
                    selectedIcon === icon 
                      ? 'bg-slate-900 text-white border-slate-900' 
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {renderIcon(icon, { size: 20 })}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-20 p-1 rounded border cursor-pointer"
              />
              <span className="text-xs text-gray-500">
                {eventType === 'marker' ? 'Color of the vertical line & badge' : 'Accent color for the card'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="Add details..."
            />
          </div>

          {eventType === 'standard' && (
            <div className="flex items-center space-x-2 pt-2">
                <input 
                  type="checkbox" 
                  id="completed"
                  checked={isCompleted} 
                  onChange={(e) => setIsCompleted(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="completed" className="text-sm font-medium text-gray-700 cursor-pointer">Mark as Completed</label>
            </div>
          )}

          <div className="flex justify-between pt-2 mt-4 border-t border-gray-100 flex-shrink-0">
            {existingEvent ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(existingEvent.id);
                  onClose();
                }}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center text-sm font-medium transition-colors"
              >
                <Trash2 size={16} className="mr-2" />
                Delete
              </button>
            ) : (
                <div /> /* Spacer */
            )}
            
            <button
              type="submit"
              className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center text-sm font-medium shadow-lg shadow-slate-200 transition-all hover:shadow-xl"
            >
              <Save size={16} className="mr-2" />
              Save Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};