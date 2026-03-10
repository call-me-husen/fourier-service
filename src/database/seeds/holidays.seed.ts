import dayjs from 'dayjs';
import { Holiday } from '../../shared/entities/holiday.entity';
import { AppDataSource } from '../data-source';

function getWeekends(year: number) {
  // fist weekend of the year using dayjs
  const firstWeekend = dayjs(`${year}-01-01`).day(6);
  const endOfYear = dayjs(`${year}-12-31`);

  let currentDate = firstWeekend;
  const weekends: string[] = [];

  while (currentDate.isBefore(endOfYear)) {
    // Get saturday and sunday of the current weekend
    const saturday = currentDate;
    const sunday = currentDate.add(1, 'day');

    weekends.push(saturday.format('YYYY-MM-DD'));
    if (sunday.isBefore(endOfYear)) {
      weekends.push(sunday.format('YYYY-MM-DD'));
    }

    // Move to the next weekend
    currentDate = currentDate.add(7, 'day');
  }
  return weekends;
}

export async function seedHolidays() {
  const holidays = getWeekends(2026);

  const holidayRepository = AppDataSource.getRepository(Holiday);

  for (const date of holidays) {
    const existingHoliday = await holidayRepository.findOneBy({ date });
    if (!existingHoliday) {
      await holidayRepository.save({
        name: 'Weekend',
        date,
        description: 'This day is a weekend holiday.',
      });
    }
  }

  console.log('✔ holidays seeded');
}
