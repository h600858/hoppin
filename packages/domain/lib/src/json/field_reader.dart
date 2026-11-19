import '../values/local_date.dart';
import '../values/local_time.dart';
import 'wire_enum.dart';

// Readers that check values against the same rules as the JSON Schema in
// shared/schema. Every failure is a FormatException that names the field.

final _instantPattern = RegExp(
  r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$',
);

Never _fail(String label, String expected, Object? value) =>
    throw FormatException('$label: forventet $expected', value);

/// Reads a string with the given length and pattern rules.
String readString(
  Object? value,
  String label, {
  int minLength = 1,
  int? maxLength,
  RegExp? pattern,
}) {
  if (value is! String) {
    _fail(label, 'tekst', value);
  }
  if (value.length < minLength) {
    _fail(label, 'minst $minLength tegn', value);
  }
  if (maxLength != null && value.length > maxLength) {
    _fail(label, 'høyst $maxLength tegn', value);
  }
  if (pattern != null && !pattern.hasMatch(value)) {
    _fail(label, 'tekst på riktig format', value);
  }
  return value;
}

/// Reads a whole number within optional bounds.
int readInt(Object? value, String label, {int? min, int? max}) {
  if (value is! int) {
    _fail(label, 'et heltall', value);
  }
  if (min != null && value < min) {
    _fail(label, 'minst $min', value);
  }
  if (max != null && value > max) {
    _fail(label, 'høyst $max', value);
  }
  return value;
}

/// Reads a number within optional bounds.
double readNumber(Object? value, String label, {num? min, num? max}) {
  if (value is! num) {
    _fail(label, 'et tall', value);
  }
  if (min != null && value < min) {
    _fail(label, 'minst $min', value);
  }
  if (max != null && value > max) {
    _fail(label, 'høyst $max', value);
  }
  return value.toDouble();
}

/// Reads one of the values of a [WireEnum].
T readEnum<T extends WireEnum>(Object? value, String label, List<T> values) {
  if (value is! String) {
    _fail(label, 'tekst', value);
  }
  return parseWireEnum(values, value, label);
}

/// Reads a nested object with [parse] and rejects fields it did not read.
T readObject<T>(
  Object? value,
  String label,
  T Function(FieldReader reader) parse,
) {
  final reader = FieldReader(value, label);
  final result = parse(reader);
  reader.done();
  return result;
}

/// Reads the fields of one object. Each read marks the field as known, and
/// [done] rejects fields that were never read, like
/// `additionalProperties: false` in the schema.
class FieldReader {
  factory FieldReader(Object? source, String label) {
    if (source is! Map) {
      _fail(label, 'et objekt', source);
    }
    return FieldReader._(source, label);
  }

  FieldReader._(this._map, this.label);

  final Map<Object?, Object?> _map;
  final Set<Object?> _read = {};

  /// Where in the document this object is, used in error messages.
  final String label;

  String _labelOf(String key) => '$label.$key';

  Object? _take(String key) {
    if (!_map.containsKey(key)) {
      throw FormatException('${_labelOf(key)}: mangler');
    }
    _read.add(key);
    return _map[key];
  }

  /// Rejects fields that no reader asked for.
  void done() {
    final unknown = _map.keys.where((key) => !_read.contains(key)).toList();
    if (unknown.isNotEmpty) {
      throw FormatException('$label: ukjente felt ${unknown.join(', ')}');
    }
  }

  String string(
    String key, {
    int minLength = 1,
    int? maxLength,
    RegExp? pattern,
  }) => readString(
    _take(key),
    _labelOf(key),
    minLength: minLength,
    maxLength: maxLength,
    pattern: pattern,
  );

  String? stringOrNull(
    String key, {
    int minLength = 1,
    int? maxLength,
    RegExp? pattern,
  }) {
    final value = _take(key);
    if (value == null) {
      return null;
    }
    return readString(
      value,
      _labelOf(key),
      minLength: minLength,
      maxLength: maxLength,
      pattern: pattern,
    );
  }

  int integer(String key, {int? min, int? max}) =>
      readInt(_take(key), _labelOf(key), min: min, max: max);

  int? integerOrNull(String key, {int? min, int? max}) {
    final value = _take(key);
    if (value == null) {
      return null;
    }
    return readInt(value, _labelOf(key), min: min, max: max);
  }

  double number(String key, {num? min, num? max}) =>
      readNumber(_take(key), _labelOf(key), min: min, max: max);

  double? numberOrNull(String key, {num? min, num? max}) {
    final value = _take(key);
    if (value == null) {
      return null;
    }
    return readNumber(value, _labelOf(key), min: min, max: max);
  }

  bool boolean(String key) {
    final value = _take(key);
    if (value is! bool) {
      _fail(_labelOf(key), 'true eller false', value);
    }
    return value;
  }

  bool? booleanOrNull(String key) {
    final value = _take(key);
    if (value == null) {
      return null;
    }
    if (value is! bool) {
      _fail(_labelOf(key), 'true, false eller null', value);
    }
    return value;
  }

  /// Reads a point in time. Accepts a DateTime (converted from a Firestore
  /// Timestamp by the data layer) or an ISO 8601 string with time zone.
  DateTime instant(String key) => _instant(_take(key), _labelOf(key));

  DateTime? instantOrNull(String key) {
    final value = _take(key);
    if (value == null) {
      return null;
    }
    return _instant(value, _labelOf(key));
  }

  DateTime _instant(Object? value, String label) {
    if (value is DateTime) {
      return value.toUtc();
    }
    if (value is String && _instantPattern.hasMatch(value)) {
      return DateTime.parse(value).toUtc();
    }
    _fail(label, 'tidspunkt (ISO 8601 med tidssone)', value);
  }

  LocalDate localDate(String key) => _localDate(_take(key), _labelOf(key));

  LocalDate? localDateOrNull(String key) {
    final value = _take(key);
    if (value == null) {
      return null;
    }
    return _localDate(value, _labelOf(key));
  }

  LocalDate _localDate(Object? value, String label) {
    if (value is! String) {
      _fail(label, 'dato (YYYY-MM-DD)', value);
    }
    try {
      return LocalDate.parse(value);
    } on FormatException {
      _fail(label, 'dato (YYYY-MM-DD)', value);
    }
  }

  LocalTime localTime(String key) {
    final value = _take(key);
    if (value is! String) {
      _fail(_labelOf(key), 'klokkeslett (HH:mm)', value);
    }
    try {
      return LocalTime.parse(value);
    } on FormatException {
      _fail(_labelOf(key), 'klokkeslett (HH:mm)', value);
    }
  }

  T enumValue<T extends WireEnum>(String key, List<T> values) =>
      readEnum(_take(key), _labelOf(key), values);

  T? enumOrNull<T extends WireEnum>(String key, List<T> values) {
    final value = _take(key);
    if (value == null) {
      return null;
    }
    return readEnum(value, _labelOf(key), values);
  }

  /// Reads a list. [item] reads one element, given its value and label.
  List<T> list<T>(
    String key,
    T Function(Object? value, String label) item, {
    int minItems = 0,
    int? maxItems,
    bool unique = false,
  }) {
    final value = _take(key);
    final label = _labelOf(key);
    if (value is! List) {
      _fail(label, 'en liste', value);
    }
    if (value.length < minItems) {
      _fail(label, 'minst $minItems elementer', value);
    }
    if (maxItems != null && value.length > maxItems) {
      _fail(label, 'høyst $maxItems elementer', value);
    }
    final items = [
      for (var i = 0; i < value.length; i++) item(value[i], '$label[$i]'),
    ];
    if (unique && items.toSet().length != items.length) {
      _fail(label, 'unike elementer', value);
    }
    return items;
  }

  T object<T>(String key, T Function(FieldReader reader) parse) =>
      readObject(_take(key), _labelOf(key), parse);

  T? objectOrNull<T>(String key, T Function(FieldReader reader) parse) {
    final value = _take(key);
    if (value == null) {
      return null;
    }
    return readObject(value, _labelOf(key), parse);
  }
}
