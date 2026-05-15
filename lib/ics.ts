/**
 * Tiny iCalendar (RFC 5545) builder. Used to expose a per-user feed of
 * trainings + matches that any calendar app (Google Calendar, Apple, Outlook)
 * can subscribe to.
 *
 * No external dependency — keeps bundle small + we control the exact output.
 */

export interface IcsEvent {
  uid: string;                  // globally unique, e.g. `training-{id}@salama`
  start: Date;
  end: Date;
  summary: string;
  description?: string | null;
  location?: string | null;
  url?: string | null;
}

export interface IcsCalendar {
  name: string;                 // calendar display name
  timezone?: string;            // IANA TZ, e.g. "Africa/Cairo"
  events: IcsEvent[];
  refreshHours?: number;        // hint for clients (default 1)
}

/** Escape commas / semicolons / backslashes / newlines per RFC 5545 §3.3.11. */
function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/** Format a Date as UTC `YYYYMMDDTHHMMSSZ`. */
function fmtUtc(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

/** Fold long lines per RFC 5545 §3.1 (75 octets max, then CRLF + space). */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const out: string[] = [];
  let rest = line;
  out.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length > 74) {
    out.push(" " + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  if (rest.length > 0) out.push(" " + rest);
  return out.join("\r\n");
}

/** Build the full ICS document. */
export function buildIcs(cal: IcsCalendar): string {
  const stamp = fmtUtc(new Date());
  const refreshIso = `PT${Math.max(1, cal.refreshHours ?? 1)}H`;

  const header = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Salama//Academy Schedule//AR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `NAME:${escapeText(cal.name)}`,
    `X-WR-CALNAME:${escapeText(cal.name)}`,
    cal.timezone ? `X-WR-TIMEZONE:${cal.timezone}` : "",
    `REFRESH-INTERVAL;VALUE=DURATION:${refreshIso}`,
    `X-PUBLISHED-TTL:${refreshIso}`,
  ].filter(Boolean);

  const body = cal.events.flatMap((e) => {
    const lines = [
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${fmtUtc(e.start)}`,
      `DTEND:${fmtUtc(e.end)}`,
      `SUMMARY:${escapeText(e.summary)}`,
      e.description ? `DESCRIPTION:${escapeText(e.description)}` : "",
      e.location ? `LOCATION:${escapeText(e.location)}` : "",
      e.url ? `URL:${e.url}` : "",
      "END:VEVENT",
    ].filter(Boolean);
    return lines;
  });

  const footer = ["END:VCALENDAR"];

  return [...header, ...body, ...footer].map(fold).join("\r\n") + "\r\n";
}
