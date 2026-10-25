import type { FunctionComponent } from "preact";
import { useCallback, useMemo, useState } from "preact/hooks";
import { useUrlChange } from "../../shared/hooks/use-url-change";
import { CalendarInputs } from "./components/calendar-inputs";
import { CalendarView } from "./components/calendar-view";
import { Calendar } from "./ts/calendar";
import { Moon } from "./ts/moon";
import { props } from "./ts/props";
import type { CalendarDate } from "./ts/types";
import { readDateFromUrl, writeDateToUrl } from "./ts/url-utils";

function getDateFromUrl(calendar: Calendar): CalendarDate {
  const initialDate = readDateFromUrl();
  return calendar.normalizeDate({
    year: initialDate.year ?? 1500,
    month: initialDate.month ?? "Hammer",
    day: initialDate.day ?? 1,
  });
}

export const App: FunctionComponent = () => {
  const { calendar, moon } = useMemo(() => {
    const calendar = new Calendar(props);
    return { calendar, moon: new Moon(props, calendar) };
  }, []);
  const [date, setDate] = useState<CalendarDate>(() =>
    getDateFromUrl(calendar),
  );

  const syncDateFromUrl = useCallback(() => {
    const nextDate = getDateFromUrl(calendar);
    setDate((currentDate) =>
      Calendar.isSameDate(currentDate, nextDate) ? currentDate : nextDate,
    );
  }, [calendar]);

  const handleDateChange = useCallback(
    (value: CalendarDate) => {
      const nextDate = calendar.normalizeDate(value);
      setDate(nextDate);
      writeDateToUrl(nextDate.year, nextDate.month, nextDate.day);
    },
    [calendar],
  );

  useUrlChange(syncDateFromUrl);

  return (
    <>
      <CalendarInputs
        calendar={calendar}
        date={date}
        onDateChange={handleDateChange}
      />
      <CalendarView
        calendar={calendar}
        moon={moon}
        date={date}
        onDateSelect={handleDateChange}
      />
    </>
  );
};
