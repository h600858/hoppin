import '../enums.dart';
import '../json/common_fields.dart';
import '../json/field_reader.dart';
import '../shift_status.dart';
import '../values/local_date.dart';

/// One shift to fill (oppdrag). Collection: shifts.
class Shift {
  const Shift({
    required this.tenantId,
    required this.schoolId,
    required this.absenceId,
    required this.date,
    required this.startsAt,
    required this.endsAt,
    required this.role,
    required this.className,
    required this.subject,
    required this.grade,
    required this.requiresFormalCompetence,
    required this.status,
    required this.deadlineAt,
    required this.assignedSubstituteId,
    required this.assignedAt,
    required this.createdAt,
  });

  factory Shift.fromMap(Map<Object?, Object?> map) => readObject(
    map,
    'Shift',
    (r) => Shift(
      tenantId: r.documentId('tenantId'),
      schoolId: r.documentId('schoolId'),
      absenceId: r.documentId('absenceId'),
      date: r.localDate('date'),
      startsAt: r.instant('startsAt'),
      endsAt: r.instant('endsAt'),
      role: r.enumValue('role', Role.values),
      className: r.classNameOrNull('className'),
      subject: r.enumOrNull('subject', Subject.values),
      grade: r.gradeOrNull('grade'),
      requiresFormalCompetence: r.boolean('requiresFormalCompetence'),
      status: r.enumValue('status', ShiftStatus.values),
      deadlineAt: r.instantOrNull('deadlineAt'),
      assignedSubstituteId: r.documentIdOrNull('assignedSubstituteId'),
      assignedAt: r.instantOrNull('assignedAt'),
      createdAt: r.instant('createdAt'),
    ),
  );

  final String tenantId;
  final String schoolId;
  final String absenceId;
  final LocalDate date;
  final DateTime startsAt;
  final DateTime endsAt;
  final Role role;

  /// Null for shifts without a class, for example SFO.
  final String? className;
  final Subject? subject;
  final int? grade;
  final bool requiresFormalCompetence;
  final ShiftStatus status;

  /// When the shift escalates to a person. Null until offering starts.
  final DateTime? deadlineAt;
  final String? assignedSubstituteId;
  final DateTime? assignedAt;
  final DateTime createdAt;

  Map<String, Object?> toMap() => {
    'tenantId': tenantId,
    'schoolId': schoolId,
    'absenceId': absenceId,
    'date': date.toString(),
    'startsAt': startsAt,
    'endsAt': endsAt,
    'role': role.value,
    'className': className,
    'subject': subject?.value,
    'grade': grade,
    'requiresFormalCompetence': requiresFormalCompetence,
    'status': status.value,
    'deadlineAt': deadlineAt,
    'assignedSubstituteId': assignedSubstituteId,
    'assignedAt': assignedAt,
    'createdAt': createdAt,
  };
}
