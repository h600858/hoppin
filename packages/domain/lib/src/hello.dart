

class HelloResult {
    const HelloResult({
        required this.message,
        required this.region,
        required this.serverTime,
    });

    final String message;
    final String region;
    final DateTime serverTime;

    factory HelloResult.fromMap(Map<Object?, Object?> map){
        final message = map['message'] ;
        final region = map['region'] ;
        final serverTime = map['serverTime'] ;

        if(message is! String || region is! String || serverTime is! String){
            throw FormatException('Invalid map: $map');
        }

        return HelloResult(
            message: message,
            region: region,
            serverTime: DateTime.parse(serverTime),
        );
    }
}

abstract interface class HelloService {
    Future<HelloResult> hello({String? name});
}