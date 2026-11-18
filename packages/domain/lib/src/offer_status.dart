enum OfferStatus {
  queued('queued'),
  sent('sent'),
  accepted('accepted'),
  declined('declined'),
  expired('expired'),
  superseded('superseded'),
  withdrawn('withdrawn'),
  undone('undone');

  const OfferStatus(this.value);

  /// The value stored in Firestore.
  final String value;

  static OfferStatus fromValue(String value) => OfferStatus.values.firstWhere(
    (status) => status.value == value,
    orElse: () => throw FormatException('Ukjent tilbudsstatus', value),
  );

  Set<OfferStatus> get allowedNext => switch (this) {
    OfferStatus.queued => const {OfferStatus.sent, OfferStatus.withdrawn},
    OfferStatus.sent => const {
      OfferStatus.accepted,
      OfferStatus.declined,
      OfferStatus.expired,
      OfferStatus.superseded,
      OfferStatus.withdrawn,
    },
    OfferStatus.accepted => const {OfferStatus.undone},
    OfferStatus.declined ||
    OfferStatus.expired ||
    OfferStatus.superseded ||
    OfferStatus.withdrawn ||
    OfferStatus.undone => const {},
  };

  bool canTransitionTo(OfferStatus next) => allowedNext.contains(next);
}
