import '../enums.dart';
import '../json/common_fields.dart';
import '../json/field_reader.dart';

/// A confirmed shift for one substitute. Collection: assignments.
class Assignment {
  const Assignment({
    required this.tenantId,
    required this.schoolId,
    required this.shiftId,
    required this.substituteId,
    required this.offerId,
    required this.source,
    required this.startsAt,
    required this.endsAt,
    required this.confirmedAt,
    required this.cancelledAt,
    required this.attended,
    required this.feedback,
  });

  factory Assignment.fromMap(Map<Object?, Object?> map) => readObject(
    map,
    'Assignment',
    (r) => Assignment(
      tenantId: r.documentId('tenantId'),
      schoolId: r.documentId('schoolId'),
      shiftId: r.documentId('shiftId'),
      substituteId: r.documentId('substituteId'),
      offerId: r.documentIdOrNull('offerId'),
      source: r.enumValue('source', AssignmentSource.values),
      startsAt: r.instant('startsAt'),
      endsAt: r.instant('endsAt'),
      confirmedAt: r.instant('confirmedAt'),
      cancelledAt: r.instantOrNull('cancelledAt'),
      attended: r.booleanOrNull('attended'),
      feedback: r.objectOrNull('feedback', AssignmentFeedback._read),
    ),
  );

  final String tenantId;
  final String schoolId;
  final String shiftId;
  final String substituteId;

  /// Null when an admin assigned the shift manually.
  final String? offerId;
  final AssignmentSource source;
  final DateTime startsAt;
  final DateTime endsAt;
  final DateTime confirmedAt;

  /// Set when the substitute withdraws.
  final DateTime? cancelledAt;

  /// Null until the school has registered attendance.
  final bool? attended;
  final AssignmentFeedback? feedback;

  Map<String, Object?> toMap() => {
    'tenantId': tenantId,
    'schoolId': schoolId,
    'shiftId': shiftId,
    'substituteId': substituteId,
    'offerId': offerId,
    'source': source.value,
    'startsAt': startsAt,
    'endsAt': endsAt,
    'confirmedAt': confirmedAt,
    'cancelledAt': cancelledAt,
    'attended': attended,
    'feedback': feedback?.toMap(),
  };
}

/// The school's feedback on an assignment. Personal data about the
/// substitute, visible on access request.
class AssignmentFeedback {
  const AssignmentFeedback({
    required this.rating,
    required this.comment,
    required this.givenBy,
    required this.givenAt,
  });

  static AssignmentFeedback _read(FieldReader r) => AssignmentFeedback(
    rating: r.integer('rating', min: 1, max: 5),
    comment: r.stringOrNull('comment', maxLength: 500),
    givenBy: r.documentId('givenBy'),
    givenAt: r.instant('givenAt'),
  );

  final int rating;
  final String? comment;
  final String givenBy;
  final DateTime givenAt;

  Map<String, Object?> toMap() => {
    'rating': rating,
    'comment': comment,
    'givenBy': givenBy,
    'givenAt': givenAt,
  };
}
