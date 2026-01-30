import { DAVClient, DAVCalendar, DAVCalendarObject } from 'tsdav';

export interface CalDAVConfig {
  username: string;
  password: string;
  serverUrl: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  location: string;
  participants: Array<{ email: string; name?: string }>;
}

export class CalDAVCalendarClient {
  private config: CalDAVConfig;
  private client: DAVClient | null = null;

  constructor(config: CalDAVConfig) {
    this.config = config;
  }

  private async getClient(): Promise<DAVClient> {
    if (this.client) return this.client;

    this.client = new DAVClient({
      serverUrl: this.config.serverUrl,
      credentials: {
        username: this.config.username,
        password: this.config.password,
      },
      authMethod: 'Basic',
      defaultAccountType: 'caldav',
    });

    await this.client.login();
    return this.client;
  }

  async getCalendars(): Promise<any[]> {
    const client = await this.getClient();
    const calendars = await client.fetchCalendars();

    return calendars.map((cal: DAVCalendar) => ({
      id: cal.url,
      name: cal.displayName || 'Unnamed',
      url: cal.url,
      color: cal.calendarColor,
      description: cal.description,
    }));
  }

  async getCalendarEvents(calendarId?: string, limit: number = 50, startDate?: string, endDate?: string): Promise<any[]> {
    const client = await this.getClient();
    const calendars = await client.fetchCalendars();

    const target = calendarId
      ? calendars.filter((c: DAVCalendar) => c.url === calendarId || c.displayName === calendarId)
      : calendars;

    if (target.length === 0) {
      throw new Error(`Calendar not found: ${calendarId}`);
    }

    const allEvents: CalendarEvent[] = [];

    for (const calendar of target) {
      const fetchOptions: any = { calendar };
      if (startDate && endDate) {
        const start = startDate.includes('T') ? startDate : `${startDate}T00:00:00`;
        const end = endDate.includes('T') ? endDate : `${endDate}T23:59:59`;
        fetchOptions.timeRange = { start, end };
      }
      const objects = await client.fetchCalendarObjects(fetchOptions);

      for (const obj of objects) {
        const parsed = parseICS(obj.data as string);
        if (parsed) allEvents.push(parsed);
      }
    }

    allEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return allEvents.slice(0, limit);
  }

  async getCalendarEventById(eventId: string): Promise<any> {
    const client = await this.getClient();
    const calendars = await client.fetchCalendars();

    for (const calendar of calendars) {
      const objects = await client.fetchCalendarObjects({ calendar });

      for (const obj of objects) {
        const parsed = parseICS(obj.data as string);
        if (parsed && (parsed.id === eventId || obj.url === eventId)) {
          return parsed;
        }
      }
    }

    throw new Error(`Calendar event not found: ${eventId}`);
  }
}

function parseICS(icsData: string): CalendarEvent | null {
  const veventMatch = icsData.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/);
  if (!veventMatch) return null;

  const vevent = veventMatch[0];

  return {
    id: extractProp(vevent, 'UID') || '',
    title: extractProp(vevent, 'SUMMARY') || 'Untitled',
    description: extractProp(vevent, 'DESCRIPTION') || '',
    start: formatICSDate(extractProp(vevent, 'DTSTART') || ''),
    end: formatICSDate(extractProp(vevent, 'DTEND') || ''),
    location: extractProp(vevent, 'LOCATION') || '',
    participants: extractAttendees(vevent),
  };
}

function extractProp(vevent: string, prop: string): string | null {
  // Match property with optional params (e.g. DTSTART;TZID=Australia/Brisbane:20260130T090000)
  const regex = new RegExp(`^${prop}[;:](.*)$`, 'm');
  const match = vevent.match(regex);
  if (!match) return null;

  // Strip params prefix if present (everything before the last colon for date props)
  const raw = match[1];
  if (prop.startsWith('DT') || prop === 'CREATED' || prop === 'LAST-MODIFIED') {
    const colonIdx = raw.indexOf(':');
    return colonIdx >= 0 ? raw.substring(colonIdx + 1) : raw;
  }

  return unfoldICS(raw);
}

function unfoldICS(value: string): string {
  return value.replace(/\r?\n[ \t]/g, '').replace(/\\n/g, '\n').replace(/\\,/g, ',');
}

function formatICSDate(icsDate: string): string {
  if (!icsDate) return '';

  // Already ISO format
  if (icsDate.includes('-')) return icsDate;

  // Date only: 20260130
  if (icsDate.length === 8) {
    return `${icsDate.slice(0, 4)}-${icsDate.slice(4, 6)}-${icsDate.slice(6, 8)}`;
  }

  // DateTime: 20260130T090000 or 20260130T090000Z
  const match = icsDate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (match) {
    const [, y, mo, d, h, mi, s, z] = match;
    return `${y}-${mo}-${d}T${h}:${mi}:${s}${z}`;
  }

  return icsDate;
}

function extractAttendees(vevent: string): Array<{ email: string; name?: string }> {
  const attendees: Array<{ email: string; name?: string }> = [];
  const regex = /^ATTENDEE[;:](.*?)$/gm;
  let match;

  while ((match = regex.exec(vevent)) !== null) {
    const line = match[1];
    const emailMatch = line.match(/mailto:([^\s;]+)/i);
    const nameMatch = line.match(/CN=([^;:]+)/i);

    if (emailMatch) {
      attendees.push({
        email: emailMatch[1],
        ...(nameMatch ? { name: nameMatch[1] } : {}),
      });
    }
  }

  return attendees;
}
