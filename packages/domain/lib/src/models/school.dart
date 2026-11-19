import '../json/common_fields.dart';
import '../json/field_reader.dart';

final _supportedTimeZones = RegExp(r'^Europe/Oslo$');

/// A school. Collection: schools.
class School {
  const School({
    required this.tenantId,
    required this.name,
    required this.timeZone,
    required this.grades,
    required this.escalationStaffIds,
    required this.sharesSubstitutePool,
    required this.active,
  });

  factory School.fromMap(Map<Object?, Object?> map) => readObject(
    map,
    'School',
    (r) => School(
      tenantId: r.documentId('tenantId'),
      name: r.string('name', maxLength: 120),
      timeZone: r.string('timeZone', pattern: _supportedTimeZones),
      grades: r.list('grades', readGrade, minItems: 1, unique: true),
      escalationStaffIds: r.list(
        'escalationStaffIds',
        readDocumentId,
        unique: true,
      ),
      sharesSubstitutePool: r.boolean('sharesSubstitutePool'),
      active: r.boolean('active'),
    ),
  );

  final String tenantId;
  final String name;
  final String timeZone;
  final List<int> grades;

  /// Staff who receive escalations, in order.
  final List<String> escalationStaffIds;

  /// Whether substitutes from other schools in the tenant may be asked.
  final bool sharesSubstitutePool;
  final bool active;

  Map<String, Object?> toMap() => {
    'tenantId': tenantId,
    'name': name,
    'timeZone': timeZone,
    'grades': grades,
    'escalationStaffIds': escalationStaffIds,
    'sharesSubstitutePool': sharesSubstitutePool,
    'active': active,
  };
}
