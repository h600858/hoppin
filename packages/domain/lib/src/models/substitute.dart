import '../enums.dart';
import '../json/common_fields.dart';
import '../json/field_reader.dart';
import '../values/local_date.dart';
import '../values/local_time.dart';

final _emailPattern = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

/// A substitute in the register. Collection: substitutes.
///
/// Computed history for matching is added in step 3.
class Substitute {
  const Substitute({
    required this.tenantId,
    required this.schoolIds,
    required this.name,
    required this.phone,
    required this.email,
    required this.authUid,
    required this.status,
    required this.roles,
    required this.qualifications,
    required this.preferences,
    required this.classBlocks,
  });

  factory Substitute.fromMap(Map<Object?, Object?> map) => readObject(
    map,
    'Substitute',
    (r) => Substitute(
      tenantId: r.documentId('tenantId'),
      schoolIds: r.list('schoolIds', readDocumentId, minItems: 1, unique: true),
      name: r.string('name', maxLength: 120),
      phone: r.phone('phone'),
      email: r.stringOrNull('email', pattern: _emailPattern),
      authUid: r.documentIdOrNull('authUid'),
      status: r.enumValue('status', SubstituteStatus.values),
      roles: r.list('roles', readRole, minItems: 1, unique: true),
      qualifications: r.object('qualifications', Qualifications._read),
      preferences: r.object('preferences', SubstitutePreferences._read),
      classBlocks: r.list(
        'classBlocks',
        (value, label) => readObject(value, label, ClassBlock._read),
      ),
    ),
  );

  final String tenantId;

  /// Schools the substitute works for.
  final List<String> schoolIds;
  final String name;
  final String phone;
  final String? email;

  /// Firebase Auth user. Null for substitutes without the app.
  final String? authUid;
  final SubstituteStatus status;
  final List<Role> roles;
  final Qualifications qualifications;
  final SubstitutePreferences preferences;

  /// Classes this substitute must not be asked for.
  final List<ClassBlock> classBlocks;

  Map<String, Object?> toMap() => {
    'tenantId': tenantId,
    'schoolIds': schoolIds,
    'name': name,
    'phone': phone,
    'email': email,
    'authUid': authUid,
    'status': status.value,
    'roles': [for (final role in roles) role.value],
    'qualifications': qualifications.toMap(),
    'preferences': preferences.toMap(),
    'classBlocks': [for (final block in classBlocks) block.toMap()],
  };
}

class Qualifications {
  const Qualifications({
    required this.teacherEducation,
    required this.certificates,
    required this.teachingSubjects,
    required this.policeCertificate,
  });

  static Qualifications _read(FieldReader r) => Qualifications(
    teacherEducation: r.boolean('teacherEducation'),
    certificates: r.list(
      'certificates',
      (value, label) => readString(value, label, maxLength: 80),
      unique: true,
    ),
    teachingSubjects: r.list(
      'teachingSubjects',
      (value, label) => readObject(value, label, TeachingSubject._read),
    ),
    policeCertificate: r.objectOrNull(
      'policeCertificate',
      PoliceCertificate._read,
    ),
  );

  final bool teacherEducation;

  /// Trade certificates, for example barne_og_ungdomsarbeider.
  final List<String> certificates;
  final List<TeachingSubject> teachingSubjects;

  /// Null means no valid certificate is registered. Hard filter (rule 10).
  final PoliceCertificate? policeCertificate;

  Map<String, Object?> toMap() => {
    'teacherEducation': teacherEducation,
    'certificates': certificates,
    'teachingSubjects': [
      for (final subject in teachingSubjects) subject.toMap(),
    ],
    'policeCertificate': policeCertificate?.toMap(),
  };
}

class TeachingSubject {
  const TeachingSubject({
    required this.subject,
    required this.grades,
    required this.level,
  });

  static TeachingSubject _read(FieldReader r) => TeachingSubject(
    subject: r.enumValue('subject', Subject.values),
    grades: r.list('grades', readGrade, minItems: 1, unique: true),
    level: r.integer('level', min: 1, max: 3),
  );

  final Subject subject;
  final List<int> grades;

  /// Competence level 1 to 3.
  final int level;

  Map<String, Object?> toMap() => {
    'subject': subject.value,
    'grades': grades,
    'level': level,
  };
}

class PoliceCertificate {
  const PoliceCertificate({required this.issuedOn, required this.expiresOn});

  static PoliceCertificate _read(FieldReader r) => PoliceCertificate(
    issuedOn: r.localDate('issuedOn'),
    expiresOn: r.localDate('expiresOn'),
  );

  final LocalDate issuedOn;
  final LocalDate expiresOn;

  Map<String, Object?> toMap() => {
    'issuedOn': issuedOn.toString(),
    'expiresOn': expiresOn.toString(),
  };
}

class SubstitutePreferences {
  const SubstitutePreferences({
    required this.weekdays,
    required this.earliestStart,
    required this.latestEnd,
    required this.maxDaysPerWeek,
    required this.preferredGrades,
    required this.notificationChannel,
  });

  static SubstitutePreferences _read(FieldReader r) => SubstitutePreferences(
    weekdays: r.list('weekdays', readWeekday, unique: true),
    earliestStart: r.localTime('earliestStart'),
    latestEnd: r.localTime('latestEnd'),
    maxDaysPerWeek: r.integer('maxDaysPerWeek', min: 1, max: 5),
    preferredGrades: r.list('preferredGrades', readGrade, unique: true),
    notificationChannel: r.enumValue(
      'notificationChannel',
      NotificationChannel.values,
    ),
  );

  final List<int> weekdays;
  final LocalTime earliestStart;
  final LocalTime latestEnd;
  final int maxDaysPerWeek;
  final List<int> preferredGrades;
  final NotificationChannel notificationChannel;

  Map<String, Object?> toMap() => {
    'weekdays': weekdays,
    'earliestStart': earliestStart.toString(),
    'latestEnd': latestEnd.toString(),
    'maxDaysPerWeek': maxDaysPerWeek,
    'preferredGrades': preferredGrades,
    'notificationChannel': notificationChannel.value,
  };
}

/// A class the substitute must not be asked for, with an internal reason.
class ClassBlock {
  const ClassBlock({
    required this.schoolId,
    required this.className,
    required this.reason,
    required this.since,
  });

  static ClassBlock _read(FieldReader r) => ClassBlock(
    schoolId: r.documentId('schoolId'),
    className: r.className('className'),
    reason: r.string('reason', maxLength: 300),
    since: r.localDate('since'),
  );

  final String schoolId;
  final String className;
  final String reason;
  final LocalDate since;

  Map<String, Object?> toMap() => {
    'schoolId': schoolId,
    'className': className,
    'reason': reason,
    'since': since.toString(),
  };
}
