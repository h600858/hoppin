import '../enums.dart';
import '../json/field_reader.dart';
import '../values/local_date.dart';

final _orgNumberPattern = RegExp(r'^[0-9]{9}$');
final _emailPattern = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

/// A municipality or private school owner. Collection: tenants.
///
/// No real personal data may be stored before
/// [dataProcessingAgreementSignedOn] is set.
class Tenant {
  const Tenant({
    required this.name,
    required this.orgNumber,
    required this.contactName,
    required this.contactEmail,
    required this.agreementStatus,
    required this.dataProcessingAgreementSignedOn,
  });

  factory Tenant.fromMap(Map<Object?, Object?> map) => readObject(
    map,
    'Tenant',
    (r) => Tenant(
      name: r.string('name', maxLength: 120),
      orgNumber: r.string('orgNumber', pattern: _orgNumberPattern),
      contactName: r.stringOrNull('contactName', maxLength: 120),
      contactEmail: r.stringOrNull('contactEmail', pattern: _emailPattern),
      agreementStatus: r.enumValue('agreementStatus', AgreementStatus.values),
      dataProcessingAgreementSignedOn: r.localDateOrNull(
        'dataProcessingAgreementSignedOn',
      ),
    ),
  );

  final String name;

  /// Norwegian organisation number, nine digits.
  final String orgNumber;
  final String? contactName;
  final String? contactEmail;
  final AgreementStatus agreementStatus;
  final LocalDate? dataProcessingAgreementSignedOn;

  Map<String, Object?> toMap() => {
    'name': name,
    'orgNumber': orgNumber,
    'contactName': contactName,
    'contactEmail': contactEmail,
    'agreementStatus': agreementStatus.value,
    'dataProcessingAgreementSignedOn':
        dataProcessingAgreementSignedOn?.toString(),
  };
}
