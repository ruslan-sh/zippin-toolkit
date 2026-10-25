import { FunctionComponent } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";
import { useUrlChange } from "../../shared/hooks/use-url-change";
import { CalendarInputs } from "./components/calendar-inputs";
import { CalendarDate } from "./ts/types";
import { props } from "./ts/props";
import { Calendar } from "./ts/calendar";
import { renderSelectedDate } from "./ts/render";
import { readDateFromUrl } from "./ts/url-utils";

function getDateFromUrl(): CalendarDate {
  const initialDate = readDateFromUrl();
  return {
    year: initialDate.year ?? 1500,
    month: initialDate.month ?? "Hammer",
    day: initialDate.day ?? 1,
  };
}

export const App: FunctionComponent = () => {
  const [date, setDate] = useState<CalendarDate>(getDateFromUrl);
  const calendar = new Calendar(props);

  const syncDateFromUrl = useCallback(() => {
    const nextDate = getDateFromUrl();
    setDate((currentDate) =>
      Calendar.isSameDate(currentDate, nextDate) ? currentDate : nextDate,
    );
  }, []);

  useUrlChange(syncDateFromUrl);

  useEffect(() => {
    renderSelectedDate(date);
  }, [date]);

  return (
    <>
      <CalendarInputs calendar={calendar} date={date} onDateChange={setDate} />
      <div id="calendarContainer"></div>
    </>
  );
};
