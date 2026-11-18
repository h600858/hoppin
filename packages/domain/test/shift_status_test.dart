import 'package:domain/domain.dart';
import 'package:test/test.dart';

import 'support/fixtures.dart';

void main() {
  final fixture =
      readFixture('state-machines/shift-transitions.json')
          as Map<String, Object?>;
  final statuses = (fixture['statuses'] as List).cast<String>();
  final allowed = {
    for (final pair in (fixture['allowed'] as List).cast<List>())
      '${pair[0]}->${pair[1]}',
  };

  group('ShiftStatus', () {
    test('has exactly the statuses in the shared fixture', () {
      expect(ShiftStatus.values.map((s) => s.value).toSet(), statuses.toSet());
    });

    for (final from in ShiftStatus.values) {
      for (final to in ShiftStatus.values) {
        final expected = allowed.contains('${from.value}->${to.value}');
        test(
          '${from.value} -> ${to.value} is ${expected ? 'allowed' : 'rejected'}',
          () {
            expect(from.canTransitionTo(to), expected);
          },
        );
      }
    }

    test('fromValue parses known values and rejects the rest', () {
      expect(
        ShiftStatus.fromValue('manually_assigned'),
        ShiftStatus.manuallyAssigned,
      );
      expect(() => ShiftStatus.fromValue('Offering'), throwsFormatException);
    });
  });
}
