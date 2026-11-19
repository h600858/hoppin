import '../enums.dart';
import '../json/common_fields.dart';
import '../json/field_reader.dart';

/// A shift handed to a person after the deadline. Collection: escalations.
class Escalation {
  const Escalation({
    required this.tenantId,
    required this.schoolId,
    required this.shiftId,
    required this.decisionId,
    required this.notifiedStaffIds,
    required this.suggestions,
    required this.createdAt,
    required this.resolvedAt,
    required this.resolvedBy,
    required this.resolution,
  });

  factory Escalation.fromMap(Map<Object?, Object?> map) => readObject(
    map,
    'Escalation',
    (r) => Escalation(
      tenantId: r.documentId('tenantId'),
      schoolId: r.documentId('schoolId'),
      shiftId: r.documentId('shiftId'),
      decisionId: r.documentId('decisionId'),
      notifiedStaffIds: r.list(
        'notifiedStaffIds',
        readDocumentId,
        minItems: 1,
        unique: true,
      ),
      suggestions: r.list(
        'suggestions',
        (value, label) => readObject(value, label, EscalationSuggestion._read),
        maxItems: 5,
      ),
      createdAt: r.instant('createdAt'),
      resolvedAt: r.instantOrNull('resolvedAt'),
      resolvedBy: r.documentIdOrNull('resolvedBy'),
      resolution: r.enumOrNull('resolution', EscalationResolution.values),
    ),
  );

  final String tenantId;
  final String schoolId;
  final String shiftId;
  final String decisionId;
  final List<String> notifiedStaffIds;

  /// The best remaining candidates, ranked, with a short reason each.
  final List<EscalationSuggestion> suggestions;
  final DateTime createdAt;
  final DateTime? resolvedAt;
  final String? resolvedBy;

  /// How it was solved. Null while open.
  final EscalationResolution? resolution;

  bool get isOpen => resolvedAt == null;

  Map<String, Object?> toMap() => {
    'tenantId': tenantId,
    'schoolId': schoolId,
    'shiftId': shiftId,
    'decisionId': decisionId,
    'notifiedStaffIds': notifiedStaffIds,
    'suggestions': [for (final suggestion in suggestions) suggestion.toMap()],
    'createdAt': createdAt,
    'resolvedAt': resolvedAt,
    'resolvedBy': resolvedBy,
    'resolution': resolution?.value,
  };
}

class EscalationSuggestion {
  const EscalationSuggestion({
    required this.substituteId,
    required this.rank,
    required this.score,
    required this.reason,
  });

  static EscalationSuggestion _read(FieldReader r) => EscalationSuggestion(
    substituteId: r.documentId('substituteId'),
    rank: r.integer('rank', min: 1),
    score: r.number('score', min: 0, max: 100),
    reason: r.string('reason', maxLength: 200),
  );

  final String substituteId;
  final int rank;
  final double score;
  final String reason;

  Map<String, Object?> toMap() => {
    'substituteId': substituteId,
    'rank': rank,
    'score': score,
    'reason': reason,
  };
}
