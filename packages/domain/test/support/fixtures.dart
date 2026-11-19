import 'dart:convert';
import 'dart:io';

/// Reads a JSON file from shared/fixtures. `dart test` runs from packages/domain.
Object? readFixture(String relativePath) =>
    jsonDecode(File('../../shared/fixtures/$relativePath').readAsStringSync());

/// Reads a JSON Schema file from shared/schema.
Object? readSchema(String fileName) =>
    jsonDecode(File('../../shared/schema/$fileName').readAsStringSync());

/// Turns the output of toMap into plain JSON values, so it can be compared
/// with a fixture. DateTime becomes an ISO 8601 string in UTC.
Object? jsonify(Object? value) => switch (value) {
  DateTime time => time.toUtc().toIso8601String(),
  Map map => {for (final entry in map.entries) entry.key: jsonify(entry.value)},
  List list => [for (final item in list) jsonify(item)],
  _ => value,
};
