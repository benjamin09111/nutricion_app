---
description: Implement Feedback, Resources, and Engagement modules.
---

# Implement Support Modules

## Feedback Module
1.  **Backend**: `POST /feedback` endpoint (sends email to admin).
2.  **Frontend**: `/dashboard/feedback`. Simple form (Subject, Message, Rating).

## Resources Module (Recursos)
1.  **Backend**: `Resource` model (Title, Type, URL/Content, Category).
2.  **Frontend**: `/dashboard/recursos`. Card grid of articles/videos strings.
3.  **Feature**: "Send to Patient" button on each resource.

## Engagement Module
1.  **Structure**:
    - `/dashboard/chat` (or similar).
2.  **Features**:
    - Configuration for "Automated Reminders" (e.g., "Remind patient X to weigh in on Fridays").
    - Integration with Email/WhatsApp provider (Placeholder or n8n webhook).
