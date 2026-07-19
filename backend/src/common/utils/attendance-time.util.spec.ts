import {
  checkInOutsideShiftReason,
  shiftWindowInstants,
} from './attendance-time.util';

const shift = {
  startTime: '08:00',
  endTime: '17:00',
  gracePeriodMinutes: 15,
};
const tz = 'Asia/Riyadh';
const day = new Date(Date.UTC(2026, 6, 15)); // 2026-07-15

describe('check-in shift window', () => {
  it('allows punch at shift start', () => {
    const at = new Date('2026-07-15T08:00:00+03:00');
    expect(checkInOutsideShiftReason(at, day, shift, tz)).toBeNull();
  });

  it('allows punch just before shift end', () => {
    const at = new Date('2026-07-15T17:00:00+03:00');
    expect(checkInOutsideShiftReason(at, day, shift, tz)).toBeNull();
  });

  it('rejects punch before shift start', () => {
    const at = new Date('2026-07-15T07:59:00+03:00');
    const reason = checkInOutsideShiftReason(at, day, shift, tz);
    expect(reason).toMatch(/too early/i);
  });

  it('rejects punch after shift end', () => {
    const at = new Date('2026-07-15T17:01:00+03:00');
    const reason = checkInOutsideShiftReason(at, day, shift, tz);
    expect(reason).toMatch(/ended/i);
  });

  it('builds overnight window across midnight', () => {
    const night = {
      startTime: '22:00',
      endTime: '06:00',
      gracePeriodMinutes: 10,
    };
    const { start, end } = shiftWindowInstants(day, night, tz);
    expect(end.getTime()).toBeGreaterThan(start.getTime());
    const lateOk = new Date('2026-07-16T01:00:00+03:00');
    expect(checkInOutsideShiftReason(lateOk, day, night, tz)).toBeNull();
    const tooEarly = new Date('2026-07-15T21:00:00+03:00');
    expect(checkInOutsideShiftReason(tooEarly, day, night, tz)).toMatch(
      /too early/i,
    );
  });
});
