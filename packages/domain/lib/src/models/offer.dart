import '../enums.dart';
import '../json/common_fields.dart';
import '../json/field_reader.dart';
import '../offer_status.dart';

/// One request to one substitute (forespørsel). Collection: offers.
class Offer {
  const Offer({
    required this.tenantId,
    required this.schoolId,
    required this.shiftId,
    required this.substituteId,
    required this.decisionId,
    required this.wave,
    required this.score,
    required this.reasons,
    required this.channel,
    required this.status,
    required this.createdAt,
    required this.sentAt,
    required this.expiresAt,
    required this.respondedAt,
  });

  factory Offer.fromMap(Map<Object?, Object?> map) => readObject(
    map,
    'Offer',
    (r) => Offer(
      tenantId: r.documentId('tenantId'),
      schoolId: r.documentId('schoolId'),
      shiftId: r.documentId('shiftId'),
      substituteId: r.documentId('substituteId'),
      decisionId: r.documentId('decisionId'),
      wave: r.integer('wave', min: 1),
      score: r.number('score', min: 0, max: 100),
      reasons: r.list(
        'reasons',
        (value, label) => readString(value, label, maxLength: 200),
        maxItems: 5,
      ),
      channel: r.enumValue('channel', Channel.values),
      status: r.enumValue('status', OfferStatus.values),
      createdAt: r.instant('createdAt'),
      sentAt: r.instantOrNull('sentAt'),
      expiresAt: r.instant('expiresAt'),
      respondedAt: r.instantOrNull('respondedAt'),
    ),
  );

  final String tenantId;
  final String schoolId;
  final String shiftId;
  final String substituteId;

  /// The matching run that chose this substitute (rule 8).
  final String decisionId;
  final int wave;
  final double score;

  /// Short reasons in Norwegian, shown to the substitute.
  final List<String> reasons;
  final Channel channel;
  final OfferStatus status;
  final DateTime createdAt;
  final DateTime? sentAt;
  final DateTime expiresAt;
  final DateTime? respondedAt;

  Map<String, Object?> toMap() => {
    'tenantId': tenantId,
    'schoolId': schoolId,
    'shiftId': shiftId,
    'substituteId': substituteId,
    'decisionId': decisionId,
    'wave': wave,
    'score': score,
    'reasons': reasons,
    'channel': channel.value,
    'status': status.value,
    'createdAt': createdAt,
    'sentAt': sentAt,
    'expiresAt': expiresAt,
    'respondedAt': respondedAt,
  };
}
