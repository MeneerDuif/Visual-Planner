import { TimelineEvent } from '../types';

const STORAGE_KEY = 'blobby_data';

export interface AppData {
  dueDate: string;
  events: TimelineEvent[];
  lastSaved: string;
}

// Save current state to browser's Local Storage
export const saveToLocal = (dueDate: Date, events: TimelineEvent[]) => {
  try {
    const data: AppData = {
      dueDate: dueDate.toISOString(),
      events,
      lastSaved: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save to local storage", e);
  }
};

// Load state from browser's Local Storage
export const loadFromLocal = (): AppData | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to parse local storage", e);
    return null;
  }
};

// Trigger a file download of the current state
export const exportToFile = (dueDate: Date, events: TimelineEvent[]) => {
  const data: AppData = {
    dueDate: dueDate.toISOString(),
    events,
    lastSaved: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `blobby-plan-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Parse an uploaded JSON file
export const importFromFile = (file: File): Promise<AppData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        
        // Basic validation
        if (!data.dueDate || !Array.isArray(data.events)) {
            reject(new Error("Invalid file format: Missing due date or events"));
        }
        
        resolve(data);
      } catch (err) {
        reject(new Error("Failed to parse file. Is it a valid JSON?"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
};