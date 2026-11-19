/// An enum whose values are stored in Firestore as strings.
abstract interface class WireEnum {
  /// The value stored in Firestore.
  String get value;
}

/// Finds the enum value whose [WireEnum.value] equals [raw].
T parseWireEnum<T extends WireEnum>(List<T> values, String raw, String label) {
  for (final candidate in values) {
    if (candidate.value == raw) {
      return candidate;
    }
  }
  throw FormatException('$label: ukjent verdi', raw);
}
