import dayjs from 'dayjs';
import { Attendance } from '../../shared/entities/attendance.entity';
import { Employee } from '../../shared/entities/employee.entity';
import { Holiday } from '../../shared/entities/holiday.entity';
import { AppDataSource } from '../data-source';

type AttendanceState = 'present' | 'incomplete';

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomState(): AttendanceState {
  return Math.random() < 0.9 ? 'present' : 'incomplete';
}

function buildAttendanceTimes(date: string, state: AttendanceState) {
  const baseDate = dayjs(date);

  const isLate = Math.random() < 0.3;
  const isEarlyLeave = Math.random() < 0.15;
  const isOvertime = !isEarlyLeave && Math.random() < 0.2;

  const clockInHour = isLate ? 9 : 8;
  const clockInMinute = isLate ? randomInt(5, 45) : randomInt(0, 20);
  const clockOutHour = isEarlyLeave
    ? 15
    : isOvertime
      ? 18 + randomInt(0, 2)
      : 17;
  const clockOutMinute = isEarlyLeave ? randomInt(0, 45) : randomInt(0, 45);

  const clockIn = baseDate
    .hour(clockInHour)
    .minute(clockInMinute)
    .second(0)
    .millisecond(0)
    .toDate();
  const clockOut =
    state === 'incomplete'
      ? null
      : baseDate
          .hour(clockOutHour)
          .minute(clockOutMinute)
          .second(0)
          .millisecond(0)
          .toDate();

  return { clockIn, clockOut };
}

export async function seedAttendances() {
  const attendanceRepository = AppDataSource.getRepository(Attendance);
  const employeeRepository = AppDataSource.getRepository(Employee);
  const holidayRepository = AppDataSource.getRepository(Holiday);

  const employees = await employeeRepository.find();
  if (employees.length === 0) {
    console.error('No employees found. Please seed employees first.');
    return;
  }

  const holidays = await holidayRepository.find();
  const holidayDates = new Set(holidays.map((holiday) => holiday.date));

  const existingAttendances = await attendanceRepository.find({
    select: { id: true, date: true, employee: { id: true } },
    relations: { employee: true },
  });
  const existingKeys = new Set(
    existingAttendances.map(
      (attendance) => `${attendance.employee.id}:${attendance.date}`,
    ),
  );

  const startDate = dayjs('2026-01-01');
  const endDate = dayjs().subtract(1, 'day').endOf('day');
  const records: Array<Partial<Attendance>> = [];

  for (
    let currentDate = startDate;
    currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day');
    currentDate = currentDate.add(1, 'day')
  ) {
    const date = currentDate.format('YYYY-MM-DD');

    if (holidayDates.has(date)) {
      continue;
    }

    for (const employee of employees) {
      if (Math.random() < 0.12) {
        continue;
      }

      const existingKey = `${employee.id}:${date}`;
      if (existingKeys.has(existingKey)) {
        continue;
      }

      const state = randomState();
      const { clockIn, clockOut } = buildAttendanceTimes(date, state);

      records.push({
        employee: { id: employee.id } as Employee,
        date,
        clockIn,
        clockOut: clockOut ?? undefined,
      });
    }
  }

  if (records.length === 0) {
    console.log('✔ attendances already seeded');
    return;
  }

  const chunkSize = 500;
  for (let index = 0; index < records.length; index += chunkSize) {
    await attendanceRepository.save(records.slice(index, index + chunkSize));
  }

  console.log(`✔ seeded ${records.length} attendance records`);
}
