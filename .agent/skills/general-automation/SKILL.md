---
name: general-automation
description: Broad guide for Process Automation (RPA, ETL, Scheduling). Covers automating business tasks, handling cron jobs, and optimizing operational workflows beyond just code.
---

# General Process Automation & Efficiency

This skill applies to automating **Management Tasks**, **Business Operations**, and **External Integrations**. Use this for any project requiring operational efficiency.

## 1. The Automation Mindset

Before coding, analyze:
1. **Trigger**: What starts the task? (Time event, Webhook, Email received, File changed).
2. **Action**: What needs to happen?
3. **Outcome**: Where does the result go?

## 2. Scheduling & Cron Jobs

- **Node.js**: Use `node-cron` or `BullMQ` (Repeated Jobs) for reliable periodic execution.
- **Supabase**: Use `pg_cron` extension for database-native maintenance tasks.
- **Rules**:
  - Always have centralized logging for automated tasks.
  - Implement "Heartbeats" (Ping a monitoring URL) to ensure the scheduler itself hasn't crashed.

## 3. Web Scraping & ETL (External Data)

For getting data from legacy systems or public webs (e.g., Food Pricing Scrapers).
- **Headless Browsers**: Use **Playwright** (more modern than Puppeteer).
  - *Best Practice*: Run via Docker to avoid dependency hell.
- **Resilience**:
  - Implement exponential backoff for retries.
  - Use rotating User-Agents.

## 4. Integration Platforms (No-Code/Low-Code)

Sometimes code is overkill. Know when to use Webhooks to trigger:
- **Make (Integromat) / Zapier**: Great for "Email -> Spreadsheet" flows.
- **n8n**: Open source, self-hostable alternative. Excellent for heavy workflows.

## 5. File & Asset Automation

- **Auto-Processing**: Listen to storage buckets (S3/Supabase Storage) events.
  - Example: User uploads PDF -> Webhook triggers -> OCR Service runs -> Text saved to DB.
- **PDF Generation**: Use `Puppeteer` or `React-PDF` for programmatic document creation.
