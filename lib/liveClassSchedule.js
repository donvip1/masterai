const weekdayIndexes = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6
};

function getLocalTimeParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    weekday: values.weekday,
    weekdayIndex: weekdayIndexes[values.weekday],
    minutes: Number(values.hour) * 60 + Number(values.minute),
    seconds: Number(values.hour) * 3600 + Number(values.minute) * 60 + Number(values.second)
  };
}

function formatSessionTime(hour) {
  return new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC"
  }).format(new Date(Date.UTC(2026, 0, 1, hour)));
}

export function getLiveClassStatus(date, classDays, liveClasses) {
  const localTime = getLocalTimeParts(date, liveClasses.timeZone);
  const classDayIndexes = new Set(classDays.map((day) => weekdayIndexes[day]));
  const sessions = [...liveClasses.sessions].sort((first, second) => first.hour - second.hour);
  const activeSession = classDayIndexes.has(localTime.weekdayIndex)
    ? sessions.find((session) => {
        const startMinutes = session.hour * 60;
        return (
          localTime.minutes >= startMinutes - liveClasses.joinLeadMinutes &&
          localTime.minutes < startMinutes + liveClasses.sessionDurationMinutes
        );
      })
    : null;

  if (activeSession) {
    const startSeconds = activeSession.hour * 3600;

    return {
      activeSession,
      activeLabel: `${activeSession.label} · ${formatSessionTime(activeSession.hour)}`,
      nextLabel: "Class room is open",
      secondsUntilStart: startSeconds - localTime.seconds
    };
  }

  for (let dayOffset = 0; dayOffset <= 7; dayOffset += 1) {
    const weekdayIndex = (localTime.weekdayIndex + dayOffset) % 7;

    if (!classDayIndexes.has(weekdayIndex)) {
      continue;
    }

    const nextSession = sessions.find((session) => (
      dayOffset > 0 || session.hour * 3600 > localTime.seconds
    ));

    if (nextSession) {
      const weekday = Object.keys(weekdayIndexes).find((day) => weekdayIndexes[day] === weekdayIndex);
      const dayLabel = dayOffset === 0 ? "Today" : weekday;

      return {
        activeSession: null,
        activeLabel: "",
        nextSession,
        nextLabel: `${dayLabel} · ${formatSessionTime(nextSession.hour)}`,
        secondsUntilStart: dayOffset * 86400 + nextSession.hour * 3600 - localTime.seconds
      };
    }
  }

  return {
    activeSession: null,
    activeLabel: "",
    nextLabel: "Schedule unavailable",
    secondsUntilStart: null
  };
}
