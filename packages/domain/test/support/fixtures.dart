import 'dart:convert';
import 'dart:io';

/// Reads a JSON file from shared/fixtures. `dart test` runs from packages/domain.
Object? readFixture(String relativePath) =>
    jsonDecode(File('../../shared/fixtures/$relativePath').readAsStringSync());
