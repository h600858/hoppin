import '../enums.dart';
import '../json/common_fields.dart';
import '../json/field_reader.dart';

final _hashPattern = RegExp(r'^[0-9a-f]{64}$');

/// Audit log of one matching run for one shift (rule 8).
/// Collection: decisions.
class Decision {
  const Decision({
    required this.tenantId,
    required this.schoolId,
    required this.shiftId,
    required this.runId,
    required this.wave,
    required this.inputHash,
    required this.algorithmVersion,
    required this.configVersion,
    required this.createdAt,
    required this.candidates,
  });

  factory Decision.fromMap(Map<Object?, Object?> map) => readObject(
    map,
    'Decision',
    (r) => Decision(
      tenantId: r.documentId('tenantId'),
      schoolId: r.documentId('schoolId'),
      shiftId: r.documentId('shiftId'),
      runId: r.documentId('runId'),
      wave: r.integer('wave', min: 1),
      inputHash: r.string('inputHash', pattern: _hashPattern),
      algorithmVersion: r.string('algorithmVersion', maxLength: 40),
      configVersion: r.integer('configVersion', min: 1),
      createdAt: r.instant('createdAt'),
      candidates: r.list(
        'candidates',
        (value, label) => readObject(value, label, DecisionCandidate._read),
      ),
    ),
  );

  final String tenantId;
  final String schoolId;
  final String shiftId;

  /// Shared by every shift in the same run.
  final String runId;
  final int wave;

  /// SHA-256 of the full input to the run, hex.
  final String inputHash;
  final String algorithmVersion;

  /// Version of the school configuration that was used.
  final int configVersion;
  final DateTime createdAt;

  /// Every candidate considered, also those excluded by a hard filter.
  final List<DecisionCandidate> candidates;

  Map<String, Object?> toMap() => {
    'tenantId': tenantId,
    'schoolId': schoolId,
    'shiftId': shiftId,
    'runId': runId,
    'wave': wave,
    'inputHash': inputHash,
    'algorithmVersion': algorithmVersion,
    'configVersion': configVersion,
    'createdAt': createdAt,
    'candidates': [for (final candidate in candidates) candidate.toMap()],
  };
}

class DecisionCandidate {
  const DecisionCandidate({
    required this.substituteId,
    required this.excludedBy,
    required this.score,
    required this.components,
    required this.selected,
  });

  static DecisionCandidate _read(FieldReader r) => DecisionCandidate(
    substituteId: r.documentId('substituteId'),
    excludedBy: r.enumOrNull('excludedBy', HardFilterName.values),
    score: r.numberOrNull('score', min: 0, max: 100),
    components: r.objectOrNull('components', ScoreComponents._read),
    selected: r.boolean('selected'),
  );

  final String substituteId;

  /// The first hard filter that excluded the candidate, or null.
  final HardFilterName? excludedBy;

  /// Total score 0 to 100. Null when excluded.
  final double? score;

  /// Sub-score per component. Null when excluded.
  final ScoreComponents? components;

  /// Whether the global assignment picked this candidate for an offer.
  final bool selected;

  Map<String, Object?> toMap() => {
    'substituteId': substituteId,
    'excludedBy': excludedBy?.value,
    'score': score,
    'components': components?.toMap(),
    'selected': selected,
  };
}

/// Sub-score per score component, each 0 to 1.
class ScoreComponents {
  const ScoreComponents({
    required this.subjectMatch,
    required this.classFamiliarity,
    required this.acceptLikelihood,
    required this.reliability,
    required this.fairness,
    required this.preferenceMatch,
    required this.proximity,
  });

  static ScoreComponents _read(FieldReader r) => ScoreComponents(
    subjectMatch: r.number('subjectMatch', min: 0, max: 1),
    classFamiliarity: r.number('classFamiliarity', min: 0, max: 1),
    acceptLikelihood: r.number('acceptLikelihood', min: 0, max: 1),
    reliability: r.number('reliability', min: 0, max: 1),
    fairness: r.number('fairness', min: 0, max: 1),
    preferenceMatch: r.number('preferenceMatch', min: 0, max: 1),
    proximity: r.number('proximity', min: 0, max: 1),
  );

  final double subjectMatch;
  final double classFamiliarity;
  final double acceptLikelihood;
  final double reliability;
  final double fairness;
  final double preferenceMatch;
  final double proximity;

  Map<String, Object?> toMap() => {
    'subjectMatch': subjectMatch,
    'classFamiliarity': classFamiliarity,
    'acceptLikelihood': acceptLikelihood,
    'reliability': reliability,
    'fairness': fairness,
    'preferenceMatch': preferenceMatch,
    'proximity': proximity,
  };
}
