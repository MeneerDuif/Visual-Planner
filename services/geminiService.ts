import { GoogleGenAI, Type } from "@google/genai";
import { TimelineEvent, EventCategory, DEFAULT_COLORS } from '../types';
import { addDays, formatDate } from '../utils/dateUtils';

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTimelineContent = async (dueDate: Date): Promise<TimelineEvent[]> => {
  const model = "gemini-2.5-flash";
  
  const dueDateStr = formatDate(dueDate);

  const prompt = `
    I am expecting a baby on ${dueDateStr}. 
    I need a structured timeline of key pregnancy milestones, medical checkups, necessary to-dos, and interesting facts.
    Focus on the period from 3 months before the due date to 6 months after birth.
    
    Based on general literature and medical guidelines:
    1. Identify critical developmental milestones for the baby.
    2. Suggest logistical to-dos (e.g., pack hospital bag, buy car seat).
    3. Suggest standard medical appointments (e.g., glucose test, 2-month vaccines).
    4. Provide interesting developmental facts (e.g., "Baby is the size of a lemon", "Baby can hear sounds").
    
    Return a list of specific events with dates calculated relative to the due date (${dueDateStr}).
  `;

  const response = await genAI.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            daysOffsetFromDue: { type: Type.NUMBER, description: "Number of days relative to due date. Negative for before birth, positive for after." },
            category: { type: Type.STRING, enum: [EventCategory.MILESTONE, EventCategory.TODO, EventCategory.MEDICAL, EventCategory.FACT, EventCategory.OTHER] }
          },
          required: ["title", "description", "daysOffsetFromDue", "category"]
        }
      }
    }
  });

  const rawData = JSON.parse(response.text || "[]");

  // Transform into app format
  return rawData.map((item: any) => {
    const eventDate = addDays(dueDate, item.daysOffsetFromDue);
    return {
      id: crypto.randomUUID(),
      title: item.title,
      description: item.description,
      date: formatDate(eventDate),
      category: item.category as EventCategory,
      color: DEFAULT_COLORS[item.category as EventCategory] || DEFAULT_COLORS[EventCategory.OTHER],
      isCompleted: false,
    } as TimelineEvent;
  });
};