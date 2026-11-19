import '../enums.dart';
import '../json/common_fields.dart';
import '../json/field_reader.dart';
import '../values/local_date.dart';
import '../values/local_time.dart';

/// One recurring lesson or duty for one staff member. Collection: timetable.
class TimetableEntry {
  const TimetableEntry({
    required this.tenantId,
    required this.schoolId,
    required this.staffId,
    required this.role,
    required this.className,
    required this.subject,
    required this.grade,
    required this.weekday,
    required this.startTime,
    required this.endTime,
    required this.room,
    required this.validFrom,
    required this.validTo,
  });

  factory TimetableEntry.fromMap(Map<Object?, Object?> map) => readObject(
    map,
    'TimetableEntry',
    (r) => TimetableEntry(
      tenantId: r.documentId('tenantId'),
      schoolId: r.documentId('schoolId'),
      staffId: r.documentId('staffId'),
      role: r.enumValue('role', Role.values),
      className: r.classNameOrNull('className'),
      subject: r.enumOrNull('subject', Subject.values),
      grade: r.gradeOrNull('grade'),
      weekday: r.weekday('weekday'),
      startTime: r.localTime('startTime'),
      endTime: r.localTime('endTime'),
      room: r.stringOrNull('room', maxLength: 40),
      validFrom: r.localDate('validFrom'),
      validTo: r.localDateOrNull('validTo'),
    ),
  );

  final String tenantId;
  final String schoolId;
  final String staffId;
  final Role role;
  final String? className;
  final Subject? subject;
  final int? grade;

  /// ISO weekday, Monday is 1.
  final int weekday;
  final LocalTime startTime;
  final LocalTime endTime;
  final String? room;
  final LocalDate validFrom;

  /// Null means until further notice.
  final LocalDate? validTo;

  Map<String, Object?> toMap() => {
    'tenantId': tenantId,
    'schoolId': schoolId,
    'staffId': staffId,
    'role': role.value,
    'className': className,
    'subject': subject?.value,
    'grade': grade,
    'weekday': weekday,
    'startTime': startTime.toString(),
    'endTime': endTime.toString(),
    'room': room,
    'validFrom': validFrom.toString(),
    'validTo': validTo?.toString(),
  };
}
