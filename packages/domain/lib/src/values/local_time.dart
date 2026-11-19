/// A wall clock time HH:mm in the school's time zone.
class LocalTime implements Comparable<LocalTime> {
  LocalTime(this.hour, this.minute) {
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      throw FormatException('Ugyldig klokkeslett', '$hour:$minute');
    }
  }

  factory LocalTime.parse(String value) {
    final match = _pattern.firstMatch(value);
    if (match == null) {
      throw FormatException('Forventet klokkeslett på formen HH:mm', value);
    }
    return LocalTime(int.parse(match.group(1)!), int.parse(match.group(2)!));
  }

  static final _pattern = RegExp(r'^([01][0-9]|2[0-3]):([0-5][0-9])$');

  final int hour;
  final int minute;

  int get minutesSinceMidnight => hour * 60 + minute;

  @override
  int compareTo(LocalTime other) =>
      minutesSinceMidnight.compareTo(other.minutesSinceMidnight);

  @override
  bool operator ==(Object other) =>
      other is LocalTime && other.hour == hour && other.minute == minute;

  @override
  int get hashCode => Object.hash(hour, minute);

  @override
  String toString() =>
      '${hour.toString().padLeft(2, '0')}:${minute.toString().padLeft(2, '0')}';
}
