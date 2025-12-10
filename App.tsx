import React, { useState, useEffect, useRef } from 'react';
import { TimelineEvent, EventCategory, EventType } from './types';
import { TimelineCanvas } from './components/TimelineCanvas';
import { EventEditor } from './components/EventEditor';
import { EventDrawer } from './components/TaskListDrawer'; 
import { generateTimelineContent } from './services/geminiService';
import { loadFromLocal, saveToLocal, exportToFile, importFromFile } from './services/storageService';
import { Baby, Loader2, Wand2, Plus, Flag, Download, Upload, Save } from 'lucide-react';
import { addDays, formatDate } from './utils/dateUtils';

function App() {
  // Lazy Initialization: Check local storage first, otherwise use defaults
  const [dueDate, setDueDate] = useState<Date>(() => {
    const saved = loadFromLocal();
    return saved ? new Date(saved.dueDate) : new Date('2026-02-14');
  });

  const [events, setEvents] = useState<TimelineEvent[]>(() => {
    const saved = loadFromLocal();
    return saved ? saved.events : [];
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // UI State
  const [editorOpen, setEditorOpen] = useState(false);
  
  // Drawer State
  const [drawerCategory, setDrawerCategory] = useState<EventCategory | null>(null);

  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [newDate, setNewDate] = useState<string>('');
  const [initialEventType, setInitialEventType] = useState<EventType>('standard');

  // Auto-save effect
  useEffect(() => {
    saveToLocal(dueDate, events);
  }, [dueDate, events]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const generatedEvents = await generateTimelineContent(dueDate);
      // Merge with existing events
      setEvents(prev => [...prev, ...generatedEvents]);
    } catch (error) {
      console.error("Failed to generate content:", error);
      alert("Failed to generate content. Please check your API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveEvent = (event: TimelineEvent) => {
    setEvents(prev => {
      const exists = prev.find(e => e.id === event.id);
      if (exists) {
        return prev.map(e => e.id === event.id ? event : e);
      }
      return [...prev, event];
    });
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const handleToggleComplete = (event: TimelineEvent) => {
    setEvents(prev => prev.map(e => 
        e.id === event.id ? { ...e, isCompleted: !e.isCompleted } : e
    ));
  };

  const handleExport = () => {
    exportToFile(dueDate, events);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await importFromFile(file);
      if (confirm(`Load plan from file? This will replace your current timeline with ${data.events.length} events.`)) {
        setDueDate(new Date(data.dueDate));
        setEvents(data.events);
      }
    } catch (error) {
      alert("Failed to load file. Please ensure it is a valid BLOBBY JSON file.");
      console.error(error);
    } finally {
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openAddModal = (dateStr: string, type: EventType = 'standard') => {
    setNewDate(dateStr);
    setInitialEventType(type);
    setEditingEvent(null);
    setEditorOpen(true);
  };

  const openEditModal = (event: TimelineEvent) => {
    setEditingEvent(event);
    setEditorOpen(true);
  };

  // Calculate stats
  const totalMilestones = events.filter(e => e.category === EventCategory.MILESTONE).length;
  const todos = events.filter(e => e.category === EventCategory.TODO);
  const totalTodos = todos.length;
  const completedTodos = todos.filter(e => e.isCompleted).length;
  const totalFacts = events.filter(e => e.category === EventCategory.FACT).length;

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-slate-900 overflow-hidden">
      
      {/* Header */}
      <header className="flex-none px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white z-20 shadow-sm relative">
        <div className="flex items-center space-x-3">
          <div className="bg-pink-100 p-2 rounded-lg text-pink-600">
            <Baby size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">BLOBBY</h1>
            <p className="text-[10px] md:text-xs text-slate-400 font-medium italic max-w-xs md:max-w-none leading-tight">
              All these milestones and facts are indications do not stress if it is different. Each child is unique.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
            <div className="hidden xl:flex items-center space-x-4 text-sm">
                <button 
                  onClick={() => setDrawerCategory(EventCategory.MILESTONE)}
                  className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-100 hover:border-amber-300 transition-all cursor-pointer group"
                >
                    <span className="text-slate-500 group-hover:text-amber-600">Milestones</span>
                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold">{totalMilestones}</span>
                </button>
                
                {/* To-Do Button */}
                <button 
                  onClick={() => setDrawerCategory(EventCategory.TODO)}
                  className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-100 hover:border-blue-300 transition-all cursor-pointer group"
                >
                    <span className="text-slate-500 group-hover:text-blue-600">To-Dos</span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                        {completedTodos > 0 && <span className="opacity-60">{completedTodos}/</span>}
                        {totalTodos}
                    </span>
                </button>

                <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 cursor-default">
                    <span className="text-slate-500">Facts</span>
                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">{totalFacts}</span>
                </div>
            </div>

            <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-slate-600 hidden sm:block">Due Date:</label>
                  <input 
                      type="date" 
                      value={dueDate.toISOString().split('T')[0]}
                      onChange={(e) => setDueDate(new Date(e.target.value))}
                      className="border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-pink-500 outline-none w-36"
                  />
              </div>

              {/* Add Marker Button */}
              <button 
                onClick={() => openAddModal(formatDate(dueDate), 'marker')}
                className="flex items-center space-x-1 bg-white border border-slate-300 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-all text-sm font-medium"
                title="Add a significant visual cue/marker"
              >
                  <Flag size={16} className="text-pink-500" />
                  <span className="hidden sm:inline">Add Cue</span>
              </button>

              <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg text-sm font-medium"
              >
                  {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                  <span className="hidden sm:inline">AI Plan</span>
              </button>

              <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>
              
              {/* Storage Controls */}
              <div className="flex items-center space-x-2">
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".json" 
                    className="hidden" 
                 />
                 <button 
                    onClick={handleImportClick}
                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Load from file (Import)"
                 >
                    <Upload size={20} />
                 </button>
                 <button 
                    onClick={handleExport}
                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Save to file (Export)"
                 >
                    <Save size={20} />
                 </button>
              </div>
            </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <TimelineCanvas 
            events={events}
            dueDate={dueDate}
            onEventClick={openEditModal}
            onAddEvent={(date) => openAddModal(date, 'standard')}
        />
      </main>

      {/* Modals & Drawers */}
      <EventEditor
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        initialDate={newDate}
        existingEvent={editingEvent}
        initialType={initialEventType}
      />

      <EventDrawer
        isOpen={!!drawerCategory}
        onClose={() => setDrawerCategory(null)}
        events={events}
        category={drawerCategory || EventCategory.TODO}
        title={drawerCategory === EventCategory.MILESTONE ? 'Milestones' : 'To-Dos'}
        onToggleComplete={handleToggleComplete}
        onEventClick={openEditModal}
      />
    </div>
  );
}

export default App;