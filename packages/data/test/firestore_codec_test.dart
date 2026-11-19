import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:data/data.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('converts Timestamps to UTC DateTime, also when nested', () {
    final instant = DateTime.utc(2026, 11, 19, 7, 30);
    final result = decodeFirestoreData({
      'startsAt': Timestamp.fromDate(instant),
      'nested': {'at': Timestamp.fromDate(instant)},
      'list': [Timestamp.fromDate(instant), 'x'],
      'plain': 5,
    });

    expect(result['startsAt'], instant);
    expect((result['nested'] as Map)['at'], instant);
    expect((result['list'] as List).first, instant);
    expect(result['plain'], 5);
  });
}
