import '../enums.dart';
import '../json/common_fields.dart';
import '../json/field_reader.dart';

/// A reported absence, or a need created by an admin. Collection: absences.
///
/// No reason category is stored (data minimisation). The comment is never
/// part of outgoing messages (rule 11).
class Absence {
  const Absence({
    required this.tenantId,
    required this.schoolId,
    required this.staffId,
    required this.startsAt,
    required this.endsAt,
    required this.comment,
    required this.source,
    required this.status,
    required this.reportedAt,
    required this.reportedBy,
  });

  factory Absence.fromMap(Map<Object?, Object?> map) => readObject(
    map,
    'Absence',
    (r) => Absence(
      tenantId: r.documentId('tenantId'),
      schoolId: r.documentId('schoolId'),
      staffId: r.documentIdOrNull('staffId'),
      startsAt: r.instant('startsAt'),
      endsAt: r.instant('endsAt'),
      comment: r.stringOrNull('comment', maxLength: 500),
      source: r.enumValue('source', AbsenceSource.values),
      status: r.enumValue('status', AbsenceStatus.values),
      reportedAt: r.instant('reportedAt'),
      reportedBy: r.documentId('reportedBy'),
    ),
  );

  final String tenantId;
  final String schoolId;

  /// Null for needs without a person, for example a vacant position.
  final String? staffId;
  final DateTime startsAt;
  final DateTime endsAt;
  final String? comment;
  final AbsenceSource source;
  final AbsenceStatus status;
  final DateTime reportedAt;

  /// Firebase Auth user who reported it.
  final String reportedBy;

  Map<String, Object?> toMap() => {
    'tenantId': tenantId,
    'schoolId': schoolId,
    'staffId': staffId,
    'startsAt': startsAt,
    'endsAt': endsAt,
    'comment': comment,
    'source': source.value,
    'status': status.value,
    'reportedAt': reportedAt,
    'reportedBy': reportedBy,
  };
}
