import type { FunctionComponent, JSX } from "preact";
import { Flex } from "../../../shared/components/flex";
import { Calendar } from "../ts/calendar";
import { Moon } from "../ts/moon";
import { MoonPhaseState } from "../ts/types";
import type { CalendarDate, CalendarMonth } from "../ts/types";

interface CalendarViewProps {
  calendar: Calendar;
  moon: Moon;
  date: CalendarDate;
  onDateSelect: (date: CalendarDate) => void;
}

const moonClasses: Partial<Record<MoonPhaseState, string>> = {
  [MoonPhaseState.Full]: "calendar__day--moon-full",
  [MoonPhaseState.New]: "calendar__day--moon-new",
  [MoonPhaseState.HalfWaning]: "calendar__day--moon-half-waning",
  [MoonPhaseState.HalfWaxing]: "calendar__day--moon-half-waxing",
};

function getMoonClass(phase: MoonPhaseState | undefined): string | undefined {
  return phase ? moonClasses[phase] : undefined;
}

function CalendarMonthView({
  calendar,
  moon,
  date,
  month,
  festivals,
  onDateSelect,
}: CalendarViewProps & { month: CalendarMonth; festivals: CalendarMonth[] }): JSX.Element {
  const daysInMonth = calendar.getDaysInMonth(date.year, month);
  const moonPhases = moon.getMonthMoonPhases(date.year, month.name);
  const weekLength = calendar.days.length;
  const weeks = Array.from({ length: Math.ceil(daysInMonth / weekLength) }, (_, index) => index);

  return (
    <div>
      <h2>{month.name}</h2>
      <p class="calendar__month-alias">{month.alias ?? ""}</p>
      <table>
        <thead>
          <tr>{calendar.days.map((day) => <th key={day.name}>{day.short}</th>)}</tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week}>
              {Array.from({ length: weekLength }, (_, offset) => {
                const day = week * weekLength + offset + 1;
                if (day > daysInMonth) return <td key={offset}></td>;

                const selected = date.month === month.name && date.day === day;
                return (
                  <td
                    key={offset}
                    class={`calendar__day ${getMoonClass(moonPhases[day]) ?? ""} ${selected ? "calendar__day--current" : ""}`.trim()}
                    data-year={date.year}
                    data-month={month.name}
                    data-day={day}
                    onClick={() => onDateSelect({ year: date.year, month: month.name, day })}
                  >
                    {day}<span class="calendar__moon-symbol"></span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {festivals.map((festival) => (
        <FestivalView key={festival.name} moon={moon} date={date} month={festival} onDateSelect={onDateSelect} />
      ))}
    </div>
  );
}

function FestivalView({
  moon,
  date,
  month,
  onDateSelect,
}: Pick<CalendarViewProps, "moon" | "date" | "onDateSelect"> & { month: CalendarMonth }): JSX.Element {
  const moonPhases = moon.getMonthMoonPhases(date.year, month.name);
  const selected = date.month === month.name && date.day === 1;
  return (
    <div class="calendar__festival">
      <h3
        class={`calendar__festival-title ${selected ? "calendar__festival-title--current" : ""} ${getMoonClass(moonPhases[1]) ?? ""}`.trim()}
        data-year={date.year}
        data-month={month.name}
        data-day={1}
        onClick={() => onDateSelect({ year: date.year, month: month.name, day: 1 })}
      >
        {month.name} Festival
        <span class="calendar__moon-symbol"></span>
      </h3>
    </div>
  );
}

export const CalendarView: FunctionComponent<CalendarViewProps> = (props) => {
  const months: Array<{ month: CalendarMonth; festivals: CalendarMonth[] }> = [];
  for (const month of props.calendar.months) {
    if (!month.isFestival) {
      months.push({ month, festivals: [] });
    } else if (
      month.leapDayMode !== "leap-only" || props.calendar.isLeapYear(props.date.year)
    ) {
      const previousMonth = months[months.length - 1];
      previousMonth?.festivals.push(month);
    }
  }

  return (
    <div id="calendarContainer" class="calendar">
      <h1 class="calendar__year">{props.date.year} {props.calendar.yearName}</h1>
      <Flex class="p-x-2" wrap="wrap" gap={4}>
        {months.map(({ month, festivals }) => (
          <CalendarMonthView key={month.name} {...props} month={month} festivals={festivals} />
        ))}
      </Flex>
    </div>
  );
};
