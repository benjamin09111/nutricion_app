# [AGENT-ONLY] Frontend Integration Guide: Appointments Service (NutriNet)

> **Role**: Coding Assistant / Frontend Developer
> **Context**: NutriNet Appointments Service (NestJS + Prisma)
> **Goal**: Implement a robust appointment calendar and work hours management.

## 0. Critical Constraints (Read First)
1. **Day Indexing**: Backend uses standard 0-6 indexing where **0 is Sunday** and **1 is Monday**. Do NOT use 1-7 or Monday=0 unless explicitly mapping it.
2. **Atomic Updates**: Work hours are updated by replacing the entire set. Always send the full array of rules for a day if you want to keep them.
3. **Data Extraction**: The API response can wrap rules in several keys. Use a robust extraction utility (see Section 3).

## 1. Discovery & Authentication
Before any action, fetch the user's calendar context.
- **Endpoint**: GET /appointments/calendars/me
- **Output**: { id: string, name: string, timeZone: string }
- **Action**: Store id as calendarId for all subsequent calls.

## 2. Managing Work Hours (Availability Rules)

### GET Rules
- **Endpoint**: GET /appointments/calendars/{calendarId}/availability/rules
- **Warning**: The backend might return data inside keys like availabilityRules, rules, or data. 
- **Mapping Requirement**:
    - startTimeLocal or startTime -> start (HH:mm)
    - endTimeLocal or endTime -> end (HH:mm)

### PUT Rules (Save)
- **Endpoint**: PUT /appointments/calendars/{calendarId}/availability/rules
- **Payload Structure**:
{
  "rules": [
    {
      "dayOfWeek": 1,
      "startTime": "09:00",
      "endTime": "13:00",
      "slotIntervalMin": 15,
      "isActive": true
    }
  ]
}

## 3. Data Normalization Utility (Use this pattern)
When receiving a payload from the rules endpoint, implement this robust extractor:
const extractRules = (payload: any) => {
  const candidates = [payload.data, payload.rules, payload.availabilityRules, payload.availability_rules];
  const list = Array.isArray(payload) ? payload : candidates.find(Array.isArray) || [];
  return list.map(item => ({
    day: mapIndexToDayKey(item.dayOfWeek),
    start: item.startTimeLocal || item.startTime,
    end: item.endTimeLocal || item.endTime,
    enabled: item.isActive ?? true
  }));
};

## 4. UI Grid & Rendering Logic
To prevent misalignment and support multiple blocks per day:

### A. The Grid Layout
Use a Row-First approach. Each row represents 1 hour.
- Container: display: flex; flex-direction: column;
- Row: display: grid; grid-template-columns: 72px repeat(7, 1fr);
- Benefit: Ensures the label "09:00" is physically locked in the same container as the cells for all 7 days.

### B. Availability Check
Do NOT assume one rule per day. Use .some():
const isWorking = (dayIndex: number, hour: number, rules: Rule[]) => {
  return rules
    .filter(r => r.dayOfWeek === dayIndex)
    .some(r => hour >= parseHour(r.startTime) && hour < parseHour(r.endTime));
};

### C. Event Positioning
When rendering an appointment (Event) inside the grid:
1. Identify the starting cell (Day + Hour).
2. Render the event block as an absolute element inside that cell.
3. Set top: 0 to align with the cell top.
4. Set height: (durationInMinutes / 60) * rowHeight.

## 5. State Management & Sync
- Refetching: After a PUT, you MUST invalidate the following TanStack Query keys:
    - ["appointments", "calendars", calendarId, "rules"]
    - ["appointments", "calendars", calendarId, "weekView"]
- Initial State: Initialize work hours as [], never with hardcoded defaults, to avoid "flashing" invented data before the API responds.
