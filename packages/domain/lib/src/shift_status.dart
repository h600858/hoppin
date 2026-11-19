import 'json/wire_enum.dart';

enum ShiftStatus implements WireEnum {
  pending('pending'),
  offering('offering'),
  claimed('claimed'),
  confirmed('confirmed'),
  completed('completed'),
  cancelled('cancelled'),
  escalated('escalated'),
  manuallyAssigned('manually_assigned'),
  unfilled('unfilled'),
  withdrawn('withdrawn');

  const ShiftStatus(this.value);

  /// The value stored in Firestore.
  @override
  final String value;

  static ShiftStatus fromValue(String value) => ShiftStatus.values.firstWhere(
    (status) => status.value == value,
    orElse: () => throw FormatException('Ukjent oppdragsstatus', value),
  );

  Set<ShiftStatus> get allowedNext => switch (this) {
    ShiftStatus.pending => const {ShiftStatus.offering, ShiftStatus.withdrawn},
    ShiftStatus.offering => const {
      ShiftStatus.claimed,
      ShiftStatus.escalated,
      ShiftStatus.withdrawn,
    },
    ShiftStatus.claimed => const {
      ShiftStatus.confirmed,
      ShiftStatus.offering,
      ShiftStatus.cancelled,
    },
    ShiftStatus.confirmed => const {ShiftStatus.completed},
    ShiftStatus.escalated => const {
      ShiftStatus.manuallyAssigned,
      ShiftStatus.unfilled,
    },
    ShiftStatus.completed ||
    ShiftStatus.cancelled ||
    ShiftStatus.manuallyAssigned ||
    ShiftStatus.unfilled ||
    ShiftStatus.withdrawn => const {},
  };

  bool canTransitionTo(ShiftStatus next) => allowedNext.contains(next);
}
