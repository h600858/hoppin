import '../enums.dart';
import '../json/common_fields.dart';
import '../json/field_reader.dart';

/// A permanent employee who can report absence. Collection: staff.
class Staff {
  const Staff({
    required this.tenantId,
    required this.schoolId,
    required this.name,
    required this.role,
    required this.phone,
    required this.authUid,
    required this.classNames,
    required this.subjects,
    required this.isSchoolAdmin,
    required this.active,
  });

  factory Staff.fromMap(Map<Object?, Object?> map) => readObject(
    map,
    'Staff',
    (r) => Staff(
      tenantId: r.documentId('tenantId'),
      schoolId: r.documentId('schoolId'),
      name: r.string('name', maxLength: 120),
      role: r.enumValue('role', Role.values),
      phone: r.phone('phone'),
      authUid: r.documentIdOrNull('authUid'),
      classNames: r.list('classNames', readClassName, unique: true),
      subjects: r.list('subjects', readSubject, unique: true),
      isSchoolAdmin: r.boolean('isSchoolAdmin'),
      active: r.boolean('active'),
    ),
  );

  final String tenantId;
  final String schoolId;
  final String name;
  final Role role;
  final String phone;

  /// Firebase Auth user, set at first login.
  final String? authUid;
  final List<String> classNames;
  final List<Subject> subjects;

  /// May use the admin web app for this school.
  final bool isSchoolAdmin;
  final bool active;

  Map<String, Object?> toMap() => {
    'tenantId': tenantId,
    'schoolId': schoolId,
    'name': name,
    'role': role.value,
    'phone': phone,
    'authUid': authUid,
    'classNames': classNames,
    'subjects': [for (final subject in subjects) subject.value],
    'isSchoolAdmin': isSchoolAdmin,
    'active': active,
  };
}
