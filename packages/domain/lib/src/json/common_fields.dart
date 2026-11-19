import '../enums.dart';
import 'field_reader.dart';

// The building blocks from shared/schema/common.schema.json.

final _phonePattern = RegExp(r'^\+[1-9][0-9]{7,14}$');

String readDocumentId(Object? value, String label) =>
    readString(value, label, maxLength: 128);

String readClassName(Object? value, String label) =>
    readString(value, label, maxLength: 16);

int readGrade(Object? value, String label) =>
    readInt(value, label, min: 1, max: 10);

int readWeekday(Object? value, String label) =>
    readInt(value, label, min: 1, max: 7);

Role readRole(Object? value, String label) =>
    readEnum(value, label, Role.values);

Subject readSubject(Object? value, String label) =>
    readEnum(value, label, Subject.values);

extension CommonFields on FieldReader {
  String documentId(String key) => string(key, maxLength: 128);

  String? documentIdOrNull(String key) => stringOrNull(key, maxLength: 128);

  String className(String key) => string(key, maxLength: 16);

  String? classNameOrNull(String key) => stringOrNull(key, maxLength: 16);

  int grade(String key) => integer(key, min: 1, max: 10);

  int? gradeOrNull(String key) => integerOrNull(key, min: 1, max: 10);

  int weekday(String key) => integer(key, min: 1, max: 7);

  String phone(String key) => string(key, pattern: _phonePattern);
}
