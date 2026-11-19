import '../enums.dart';
import '../json/common_fields.dart';
import '../json/field_reader.dart';

/// A period the substitute has marked. Collection: availability.
///
/// Busy time from assignments is derived, not stored here. No reason is
/// stored.
class Availability {
  const Availability({
    required this.tenantId,
    required this.substituteId,
    required this.kind,
    required this.startsAt,
    required this.endsAt,
    required this.source,
    required this.createdAt,
  });

  factory Availability.fromMap(Map<Object?, Object?> map) => readObject(
    map,
    'Availability',
    (r) => Availability(
      tenantId: r.documentId('tenantId'),
      substituteId: r.documentId('substituteId'),
      kind: r.enumValue('kind', AvailabilityKind.values),
      startsAt: r.instant('startsAt'),
      endsAt: r.instant('endsAt'),
      source: r.enumValue('source', AvailabilitySource.values),
      createdAt: r.instant('createdAt'),
    ),
  );

  final String tenantId;
  final String substituteId;
  final AvailabilityKind kind;
  final DateTime startsAt;
  final DateTime endsAt;
  final AvailabilitySource source;
  final DateTime createdAt;

  Map<String, Object?> toMap() => {
    'tenantId': tenantId,
    'substituteId': substituteId,
    'kind': kind.value,
    'startsAt': startsAt,
    'endsAt': endsAt,
    'source': source.value,
    'createdAt': createdAt,
  };
}
