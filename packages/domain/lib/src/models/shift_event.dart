import '../enums.dart';
import '../json/common_fields.dart';
import '../json/field_reader.dart';
import '../shift_status.dart';

final _causePattern = RegExp(r'^[a-z_]{1,40}$');

/// One status change of a shift, written by transitionShift (rule 4).
/// Collection: shifts/{shiftId}/events.
class ShiftEvent {
  const ShiftEvent({
    required this.tenantId,
    required this.schoolId,
    required this.shiftId,
    required this.from,
    required this.to,
    required this.at,
    required this.actor,
    required this.actorId,
    required this.offerId,
    required this.cause,
  });

  factory ShiftEvent.fromMap(Map<Object?, Object?> map) => readObject(
    map,
    'ShiftEvent',
    (r) => ShiftEvent(
      tenantId: r.documentId('tenantId'),
      schoolId: r.documentId('schoolId'),
      shiftId: r.documentId('shiftId'),
      from: r.enumOrNull('from', ShiftStatus.values),
      to: r.enumValue('to', ShiftStatus.values),
      at: r.instant('at'),
      actor: r.enumValue('actor', ShiftEventActor.values),
      actorId: r.documentIdOrNull('actorId'),
      offerId: r.documentIdOrNull('offerId'),
      cause: r.string('cause', pattern: _causePattern),
    ),
  );

  final String tenantId;
  final String schoolId;
  final String shiftId;

  /// Null for the event that created the shift.
  final ShiftStatus? from;
  final ShiftStatus to;
  final DateTime at;
  final ShiftEventActor actor;

  /// Who did it. Null when the system did it.
  final String? actorId;
  final String? offerId;

  /// Short machine readable cause, for example claim, undo, deadline.
  final String cause;

  Map<String, Object?> toMap() => {
    'tenantId': tenantId,
    'schoolId': schoolId,
    'shiftId': shiftId,
    'from': from?.value,
    'to': to.value,
    'at': at,
    'actor': actor.value,
    'actorId': actorId,
    'offerId': offerId,
    'cause': cause,
  };
}
