import 'package:domain/domain.dart';
import 'package:test/test.dart';

import 'support/fixtures.dart';

void main() {
  final fixture =
      readFixture('state-machines/offer-transitions.json')
          as Map<String, Object?>;
  final statuses = (fixture['statuses'] as List).cast<String>();
  final allowed = {
    for (final pair in (fixture['allowed'] as List).cast<List>())
      '${pair[0]}->${pair[1]}',
  };

  group('OfferStatus', () {
    test('has exactly the statuses in the shared fixture', () {
      expect(OfferStatus.values.map((s) => s.value).toSet(), statuses.toSet());
    });

    for (final from in OfferStatus.values) {
      for (final to in OfferStatus.values) {
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
      expect(OfferStatus.fromValue('undone'), OfferStatus.undone);
      expect(() => OfferStatus.fromValue('Sent'), throwsFormatException);
    });
  });
}
