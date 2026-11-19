import 'package:domain/domain.dart';
import 'package:test/test.dart';

import 'support/fixtures.dart';

typedef RoundTrip = Map<String, Object?> Function(Map<Object?, Object?> map);

/// Each model, read from a fixture and written back with toMap.
final Map<String, RoundTrip> models = {
  'tenant': (map) => Tenant.fromMap(map).toMap(),
  'school': (map) => School.fromMap(map).toMap(),
  'schoolConfig': (map) => SchoolConfig.fromMap(map).toMap(),
  'staff': (map) => Staff.fromMap(map).toMap(),
  'substitute': (map) => Substitute.fromMap(map).toMap(),
  'timetableEntry': (map) => TimetableEntry.fromMap(map).toMap(),
  'absence': (map) => Absence.fromMap(map).toMap(),
  'shift': (map) => Shift.fromMap(map).toMap(),
  'shiftEvent': (map) => ShiftEvent.fromMap(map).toMap(),
  'offer': (map) => Offer.fromMap(map).toMap(),
  'assignment': (map) => Assignment.fromMap(map).toMap(),
  'availability': (map) => Availability.fromMap(map).toMap(),
  'decision': (map) => Decision.fromMap(map).toMap(),
  'escalation': (map) => Escalation.fromMap(map).toMap(),
};

void main() {
  for (final MapEntry(key: name, value: roundTrip) in models.entries) {
    group(name, () {
      final fixture = readFixture('models/$name.json') as Map<String, Object?>;
      final valid = (fixture['valid'] as List).cast<Map<String, Object?>>();
      final invalid = (fixture['invalid'] as List).cast<Map<String, Object?>>();

      for (final (index, doc) in valid.indexed) {
        test('reads valid example $index and writes it back unchanged', () {
          expect(jsonify(roundTrip(doc)), doc);
        });
      }

      for (final example in invalid) {
        test('rejects: ${example['why']}', () {
          final doc = example['doc'] as Map<String, Object?>;
          expect(() => roundTrip(doc), throwsFormatException);
        });
      }
    });
  }

  group('enums match common.schema.json', () {
    final schema = readSchema('common.schema.json') as Map<String, Object?>;
    final defs = schema[r'$defs'] as Map<String, Object?>;

    Set<String> schemaValues(String name) =>
        ((defs[name] as Map<String, Object?>)['enum'] as List)
            .cast<String>()
            .toSet();

    final enums = <String, List<WireEnum>>{
      'Role': Role.values,
      'Subject': Subject.values,
      'SubstituteStatus': SubstituteStatus.values,
      'Channel': Channel.values,
      'ShiftStatus': ShiftStatus.values,
      'OfferStatus': OfferStatus.values,
    };

    for (final MapEntry(key: name, value: values) in enums.entries) {
      test(name, () {
        expect(values.map((value) => value.value).toSet(), schemaValues(name));
      });
    }
  });
}
