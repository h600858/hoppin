import '../enums.dart';
import '../json/common_fields.dart';
import '../json/field_reader.dart';
import '../values/local_time.dart';

/// Matching and dispatch configuration for one school (rule 9).
/// Collection: schoolConfigs, document ID is the school ID.
///
/// The police certificate filter is deliberately not configurable (rule 10).
class SchoolConfig {
  const SchoolConfig({
    required this.tenantId,
    required this.schoolId,
    required this.version,
    required this.updatedAt,
    required this.updatedBy,
    required this.dispatchEnabled,
    required this.weights,
    required this.filters,
    required this.waves,
    required this.quietHours,
    required this.undoWindowSeconds,
    required this.smsFallbackDelaySeconds,
    required this.maxSmsPerDay,
  });

  factory SchoolConfig.fromMap(Map<Object?, Object?> map) => readObject(
    map,
    'SchoolConfig',
    (r) => SchoolConfig(
      tenantId: r.documentId('tenantId'),
      schoolId: r.documentId('schoolId'),
      version: r.integer('version', min: 1),
      updatedAt: r.instant('updatedAt'),
      updatedBy: r.documentId('updatedBy'),
      dispatchEnabled: r.boolean('dispatchEnabled'),
      weights: r.object('weights', ScoreWeights._read),
      filters: r.object('filters', HardFilters._read),
      waves: r.object('waves', WaveTable._read),
      quietHours: r.object('quietHours', QuietHours._read),
      undoWindowSeconds: r.integer('undoWindowSeconds', min: 0, max: 600),
      smsFallbackDelaySeconds: r.integer(
        'smsFallbackDelaySeconds',
        min: 0,
        max: 900,
      ),
      maxSmsPerDay: r.integer('maxSmsPerDay', min: 0),
    ),
  );

  final String tenantId;
  final String schoolId;
  final int version;
  final DateTime updatedAt;
  final String updatedBy;

  /// Kill switch. False stops all outgoing messages for the school.
  final bool dispatchEnabled;
  final ScoreWeights weights;
  final HardFilters filters;
  final WaveTable waves;
  final QuietHours quietHours;
  final int undoWindowSeconds;

  /// Seconds to wait for a push to be opened before sending SMS.
  final int smsFallbackDelaySeconds;

  /// Safety cap per school per day.
  final int maxSmsPerDay;

  Map<String, Object?> toMap() => {
    'tenantId': tenantId,
    'schoolId': schoolId,
    'version': version,
    'updatedAt': updatedAt,
    'updatedBy': updatedBy,
    'dispatchEnabled': dispatchEnabled,
    'weights': weights.toMap(),
    'filters': filters.toMap(),
    'waves': waves.toMap(),
    'quietHours': quietHours.toMap(),
    'undoWindowSeconds': undoWindowSeconds,
    'smsFallbackDelaySeconds': smsFallbackDelaySeconds,
    'maxSmsPerDay': maxSmsPerDay,
  };
}

/// Weights of the score components. Each is 0 to 1 and they should sum to 1,
/// which the matching engine checks (step 3).
class ScoreWeights {
  const ScoreWeights({
    required this.subjectMatch,
    required this.classFamiliarity,
    required this.acceptLikelihood,
    required this.reliability,
    required this.fairness,
    required this.preferenceMatch,
    required this.proximity,
  });

  static ScoreWeights _read(FieldReader r) => ScoreWeights(
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

  double get sum =>
      subjectMatch +
      classFamiliarity +
      acceptLikelihood +
      reliability +
      fairness +
      preferenceMatch +
      proximity;

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

/// Hard filters a school may switch off. Active status and police
/// certificate always apply.
class HardFilters {
  const HardFilters({
    required this.roleMatch,
    required this.timeCollision,
    required this.classBlocks,
    required this.workingTimeLimits,
    required this.alreadyAsked,
    required this.formalCompetenceSubjects,
  });

  static HardFilters _read(FieldReader r) => HardFilters(
    roleMatch: r.boolean('roleMatch'),
    timeCollision: r.boolean('timeCollision'),
    classBlocks: r.boolean('classBlocks'),
    workingTimeLimits: r.boolean('workingTimeLimits'),
    alreadyAsked: r.boolean('alreadyAsked'),
    formalCompetenceSubjects: r.list(
      'formalCompetenceSubjects',
      readSubject,
      unique: true,
    ),
  );

  final bool roleMatch;
  final bool timeCollision;
  final bool classBlocks;
  final bool workingTimeLimits;
  final bool alreadyAsked;

  /// Subjects where only formally qualified substitutes may be asked.
  final List<Subject> formalCompetenceSubjects;

  Map<String, Object?> toMap() => {
    'roleMatch': roleMatch,
    'timeCollision': timeCollision,
    'classBlocks': classBlocks,
    'workingTimeLimits': workingTimeLimits,
    'alreadyAsked': alreadyAsked,
    'formalCompetenceSubjects': [
      for (final subject in formalCompetenceSubjects) subject.value,
    ],
  };
}

/// Wave rules per urgency, chosen by time until the shift starts.
class WaveTable {
  const WaveTable({
    required this.calm,
    required this.normal,
    required this.urgent,
    required this.critical,
  });

  static WaveTable _read(FieldReader r) => WaveTable(
    calm: r.object('calm', WaveRule._read),
    normal: r.object('normal', WaveRule._read),
    urgent: r.object('urgent', WaveRule._read),
    critical: r.object('critical', WaveRule._read),
  );

  final WaveRule calm;
  final WaveRule normal;
  final WaveRule urgent;
  final WaveRule critical;

  Map<String, Object?> toMap() => {
    'calm': calm.toMap(),
    'normal': normal.toMap(),
    'urgent': urgent.toMap(),
    'critical': critical.toMap(),
  };
}

class WaveRule {
  const WaveRule({
    required this.minMinutesBeforeStart,
    required this.waveSize,
    required this.intervalMinutes,
    required this.deadlineMinutes,
  });

  static WaveRule _read(FieldReader r) => WaveRule(
    minMinutesBeforeStart: r.integer('minMinutesBeforeStart', min: 0),
    waveSize: r.integerOrNull('waveSize', min: 1),
    intervalMinutes: r.integerOrNull('intervalMinutes', min: 1),
    deadlineMinutes: r.integer('deadlineMinutes', min: 1),
  );

  /// The rule applies when at least this many minutes remain until start.
  final int minMinutesBeforeStart;

  /// Candidates per wave. Null means all qualified.
  final int? waveSize;

  /// Minutes between waves. Null means a single dispatch.
  final int? intervalMinutes;

  /// Minutes from first dispatch until escalation.
  final int deadlineMinutes;

  Map<String, Object?> toMap() => {
    'minMinutesBeforeStart': minMinutesBeforeStart,
    'waveSize': waveSize,
    'intervalMinutes': intervalMinutes,
    'deadlineMinutes': deadlineMinutes,
  };
}

/// No messages between [start] and [end], local time. May pass midnight.
class QuietHours {
  const QuietHours({required this.start, required this.end});

  static QuietHours _read(FieldReader r) =>
      QuietHours(start: r.localTime('start'), end: r.localTime('end'));

  final LocalTime start;
  final LocalTime end;

  Map<String, Object?> toMap() => {
    'start': start.toString(),
    'end': end.toString(),
  };
}
