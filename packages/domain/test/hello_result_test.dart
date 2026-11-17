import 'package:domain/domain.dart';
import 'package:test/test.dart';

void main() {
  group('HelloResult.fromMap', () {
    test('parses a valid response', () {
      final result = HelloResult.fromMap({
        'message': 'Hei, Kari!',
        'region': 'europe-north1',
        'serverTime': '2026-11-17T06:40:00.000Z',
      });
      expect(result.message, equals('Hei, Kari!'));
      expect(result.region, equals('europe-north1'));
      expect(
        result.serverTime,
        equals(DateTime.parse('2026-11-17T06:40:00.000Z')),
      );
    });
  });

  test('throws FormatException for invalid map', () {
    expect(
      () => HelloResult.fromMap({'message': 'Hei'}),
      throwsFormatException,
    );
  });
}
