const MONTH_MAP: Record<string, number> = {
  JAN: 0,
  FEV: 1,
  MAR: 2,
  ABR: 3,
  MAI: 4,
  JUN: 5,
  JUL: 6,
  AGO: 7,
  SET: 8,
  OUT: 9,
  NOV: 10,
  DEZ: 11,
};

/** Horário local de São Paulo (NDU). */
function brazilDate(
  year: number,
  month: number,
  day: number,
  hour = 12,
  minute = 0
): Date {
  const pad = (n: number) => String(n).padStart(2, "0");
  return new Date(
    `${year}-${pad(month + 1)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00-03:00`
  );
}

export function parseNduMatchDateTime(
  label: string,
  year = new Date().getFullYear()
): Date | null {
  const cleaned = label.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  const brDateTime = cleaned.match(
    /^(\d{2})\/(\d{2})\s+(\d{1,2})h(?:(\d{2})(?:min)?)?/i
  );
  if (brDateTime) {
    const day = parseInt(brDateTime[1], 10);
    const month = parseInt(brDateTime[2], 10) - 1;
    const hour = parseInt(brDateTime[3], 10);
    const minute = brDateTime[4] ? parseInt(brDateTime[4], 10) : 0;
    if (month >= 0 && month <= 11) {
      return brazilDate(year, month, day, hour, minute);
    }
  }

  const brDateOnly = cleaned.match(/^(\d{2})\/(\d{2})(?:\s|$)/);
  if (brDateOnly) {
    const day = parseInt(brDateOnly[1], 10);
    const month = parseInt(brDateOnly[2], 10) - 1;
    if (month >= 0 && month <= 11) {
      return brazilDate(year, month, day, 12, 0);
    }
  }

  const monthLabel = cleaned.match(
    /^(\d{1,2})\s*(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)(?:\s+(\d{1,2})[h:](\d{2})?)?/i
  );
  if (monthLabel) {
    const day = parseInt(monthLabel[1], 10);
    const month = MONTH_MAP[monthLabel[2].toUpperCase()];
    const hour = monthLabel[3] ? parseInt(monthLabel[3], 10) : 12;
    const minute = monthLabel[4] ? parseInt(monthLabel[4], 10) : 0;
    if (month !== undefined) {
      return brazilDate(year, month, day, hour, minute);
    }
  }

  return null;
}
