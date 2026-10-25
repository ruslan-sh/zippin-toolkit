import type { FunctionComponent } from "preact";
import { useCallback, useState } from "preact/hooks";
import { Flex } from "../../../shared/components/flex";
import { Calendar } from "../ts/calendar";
import type { CalendarDate, CalendarMonth } from "../ts/types";
import { Input } from "../../../shared/components/input";
import { Select } from "../../../shared/components/select";
import { Button } from "../../../shared/components/button";

interface CalendarInputsProps {
  calendar: Calendar;
  date: CalendarDate;
  onDateChange: (value: CalendarDate) => void;
}

export const CalendarInputs: FunctionComponent<CalendarInputsProps> = ({
  calendar,
  date,
  onDateChange,
}) => {
  const [addDays, setAddDays] = useState(1);
  const [display, setDisplay] = useState(true);

  const dateChangeHandler = useCallback(
    (newDate: CalendarDate) => {
      let internalNewDate = newDate;
      const isLeap = calendar.isLeapYear(internalNewDate.year);

      let month: CalendarMonth | undefined = calendar.getMonthByName(
        internalNewDate.month,
      );
      if (!month || (month.leapDayMode === "leap-only" && !isLeap)) {
        // find first non leap month
        month = calendar.months.find(
          (calendarMonth) => calendarMonth.leapDayMode !== "leap-only",
        );
        if (!month) {
          throw new Error("Invalid month");
        }
        internalNewDate.month = month?.name;
      }

      internalNewDate.day = Math.min(
        internalNewDate.day,
        calendar.getDaysInMonth(internalNewDate),
      );

      onDateChange(internalNewDate);
    },
    [onDateChange, calendar],
  );

  return (
    <Flex justify="center" gap={4}>
      {display && (
        <Flex gap={2} align="center" justify="center">
          <Input
            type="integer"
            label="Year:"
            value={date.year}
            onValueChange={(year) => dateChangeHandler({ ...date, year })}
          />
          <Select
            label="Month:"
            value={date.month}
            onValueChange={(month) => dateChangeHandler({ ...date, month })}
          >
            {calendar.months.map((month) => (
              <option value={month.name}>
                {`${month.name} ${month.isFestival ? "Festival" : ""}`}
              </option>
            ))}
          </Select>
          <Input
            type="integer"
            label="Day:"
            value={date.day}
            max={calendar.getDaysInMonth(date)}
            min={1}
            onValueChange={(day) => dateChangeHandler({ ...date, day })}
          />
          <Flex gap="half">
            <Input
              type="integer"
              label="Add days:"
              value={addDays}
              onValueChange={setAddDays}
            />
            <Button
              onClick={() => {
                onDateChange(calendar.calculateDate(date, addDays));
              }}
            >
              Add
            </Button>
          </Flex>
        </Flex>
      )}
      <Button
        onClick={() => {
          setDisplay(!display);
        }}
      >
        {display ? "Hide" : "Show"}
      </Button>
    </Flex>
  );
};
