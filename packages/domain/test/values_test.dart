import 'package:domain/domain.dart';
import 'package:test/test.dart';

void main() {
  group('LocalDate', () {
    test('parses and prints YYYY-MM-DD', () {
      final date = LocalDate.parse('2027-06-14');
      expect([date.year, date.month, date.day], [2027, 6, 14]);
      expect(date.toString(), '2027-06-14');
    });

    test('rejects dates that do not exist', () {
      expect(() => LocalDate.parse('2026-02-30'), throwsFormatException);
      expect(() => LocalDate.parse('2026-2-3'), throwsFormatException);
    });

    test('compares by calendar order', () {
      expect(
        LocalDate.parse('2026-11-19').compareTo(LocalDate.parse('2027-01-01')),
        lessThan(0),
      );
      expect(LocalDate.parse('2026-11-19'), LocalDate(2026, 11, 19));
    });
  });

  group('LocalTime', () {
    test('parses and prints HH:mm', () {
      final time = LocalTime.parse('06:30');
      expect(time.minutesSinceMidnight, 390);
      expect(time.toString(), '06:30');
    });

    test('rejects times without zero padding or out of range', () {
      for (final value in ['8:30', '24:00', '12:60', '08.30']) {
        expect(() => LocalTime.parse(value), throwsFormatException);
      }
    });
  });
}
