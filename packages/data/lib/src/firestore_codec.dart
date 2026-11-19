import 'package:cloud_firestore/cloud_firestore.dart';

/// Converts Firestore Timestamps to UTC DateTime, also inside nested maps and
/// lists, so the domain models never see Firestore types (decisions/0006).
///
/// Writing needs no conversion: Firestore stores DateTime as Timestamp.
Map<String, Object?> decodeFirestoreData(Map<String, Object?> data) => {
  for (final entry in data.entries) entry.key: _decode(entry.value),
};

Object? _decode(Object? value) => switch (value) {
  Timestamp timestamp => timestamp.toDate().toUtc(),
  Map map => {for (final entry in map.entries) entry.key: _decode(entry.value)},
  List list => [for (final item in list) _decode(item)],
  _ => value,
};
