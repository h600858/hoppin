import 'json/wire_enum.dart';

// Enums from shared/schema. The Dart name is camelCase, the stored value is
// the one in the schema.

enum Role implements WireEnum {
  laerer('laerer'),
  assistent('assistent'),
  sfo('sfo');

  const Role(this.value);

  @override
  final String value;
}

enum Subject implements WireEnum {
  norsk('norsk'),
  matematikk('matematikk'),
  engelsk('engelsk'),
  naturfag('naturfag'),
  samfunnsfag('samfunnsfag'),
  krle('krle'),
  kunstOgHandverk('kunst_og_handverk'),
  musikk('musikk'),
  matOgHelse('mat_og_helse'),
  kroppsoving('kroppsoving'),
  fremmedsprak('fremmedsprak'),
  valgfag('valgfag'),
  annet('annet');

  const Subject(this.value);

  @override
  final String value;
}

enum SubstituteStatus implements WireEnum {
  active('active'),
  paused('paused'),
  left('left');

  const SubstituteStatus(this.value);

  @override
  final String value;
}

/// The channel an offer was first sent on.
enum Channel implements WireEnum {
  push('push'),
  sms('sms');

  const Channel(this.value);

  @override
  final String value;
}

/// How a substitute wants to be notified.
enum NotificationChannel implements WireEnum {
  push('push'),
  sms('sms'),
  both('both');

  const NotificationChannel(this.value);

  @override
  final String value;
}

enum AbsenceSource implements WireEnum {
  staff('staff'),
  admin('admin');

  const AbsenceSource(this.value);

  @override
  final String value;
}

enum AbsenceStatus implements WireEnum {
  active('active'),
  withdrawn('withdrawn');

  const AbsenceStatus(this.value);

  @override
  final String value;
}

enum AgreementStatus implements WireEnum {
  pilot('pilot'),
  active('active'),
  ended('ended');

  const AgreementStatus(this.value);

  @override
  final String value;
}

enum AssignmentSource implements WireEnum {
  offer('offer'),
  manual('manual');

  const AssignmentSource(this.value);

  @override
  final String value;
}

enum AvailabilityKind implements WireEnum {
  unavailable('unavailable'),
  available('available');

  const AvailabilityKind(this.value);

  @override
  final String value;
}

enum AvailabilitySource implements WireEnum {
  substitute('substitute'),
  admin('admin');

  const AvailabilitySource(this.value);

  @override
  final String value;
}

/// The hard filter that excluded a candidate in a matching run.
enum HardFilterName implements WireEnum {
  policeCertificate('police_certificate'),
  inactive('inactive'),
  role('role'),
  timeCollision('time_collision'),
  classBlock('class_block'),
  workingTimeLimit('working_time_limit'),
  formalCompetence('formal_competence'),
  alreadyAsked('already_asked'),
  openOffer('open_offer');

  const HardFilterName(this.value);

  @override
  final String value;
}

enum EscalationResolution implements WireEnum {
  manualAssignment('manual_assignment'),
  internalStaff('internal_staff'),
  mergedGroups('merged_groups'),
  otherInternal('other_internal'),
  withdrawn('withdrawn');

  const EscalationResolution(this.value);

  @override
  final String value;
}

enum ShiftEventActor implements WireEnum {
  system('system'),
  substitute('substitute'),
  staff('staff'),
  admin('admin');

  const ShiftEventActor(this.value);

  @override
  final String value;
}
