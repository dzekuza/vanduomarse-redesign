"use client";

import { CalendarPlusIcon, DownloadSimpleIcon } from "@phosphor-icons/react";
import { googleCalendarUrl, icsContent, type CalendarEvent } from "@/lib/calendar";

interface AddToCalendarProps {
  event: CalendarEvent;
  /** Booking reference: stable UID and download file name. */
  reference: string;
}

const LINK_CLASS =
  "flex min-h-11 items-center gap-2 border border-ink px-3 text-xs uppercase transition-[color,background-color,transform] hover:bg-ink hover:text-foam active:scale-[0.97]";

/** Google Calendar link plus an .ics file for Apple Calendar and Outlook. */
export function AddToCalendar({ event, reference }: AddToCalendarProps) {
  function downloadIcs() {
    const blob = new Blob([icsContent(event, reference)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reference}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm text-ink/70">Pridėti į kalendorių:</span>
      <a href={googleCalendarUrl(event)} target="_blank" rel="noreferrer" className={LINK_CLASS}>
        <CalendarPlusIcon size={16} />
        Google
      </a>
      <button type="button" onClick={downloadIcs} className={LINK_CLASS}>
        <DownloadSimpleIcon size={16} />
        Apple / Outlook
      </button>
    </div>
  );
}
