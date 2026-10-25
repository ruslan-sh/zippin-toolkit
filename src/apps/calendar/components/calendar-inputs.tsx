import type { FunctionComponent } from "preact";
import { useCallback, useState } from "preact/hooks";
import { Button } from "../../../shared/components/button";
import { Flex } from "../../../shared/components/flex";
import { Input } from "../../../shared/components/input";
import { Select } from "../../../shared/components/select";
import { Calendar } from "../ts/calendar";
import type { CalendarDate } from "../ts/types";

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
  const [addDays, setAddDays] = useState(0);
  const [display, setDisplay] = useState(true);

  const dateChangeHandler = useCallback(
    (newDate: CalendarDate) => {
      onDateChange(calendar.normalizeDate(newDate));
    },
    [onDateChange, calendar],
  );

  return (
    <Flex justify="center" gap={4} wrap="wrap">
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
            {calendar.months
              .filter(
                (month) =>
                  month.leapDayMode !== "leap-only" ||
                  calendar.isLeapYear(date.year),
              )
              .map((month) => (
                <option key={month.name} value={month.name}>
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
                dateChangeHandler(calendar.calculateDate(date, addDays));
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
