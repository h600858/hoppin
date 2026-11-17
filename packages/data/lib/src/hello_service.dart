import 'package:cloud_functions/cloud_functions.dart';
import 'package:domain/domain.dart';

class FirebaseHelloService implements HelloService {
  FirebaseHelloService(this._functions);

  final FirebaseFunctions _functions;

  @override
  Future<HelloResult> hello({String? name}) async {
    final result = await _functions
        .httpsCallable('hello')
        .call<Object?>({if (name != null) 'name': name});
    final data = result.data;
    if (data is! Map) {
      throw FormatException('Uventet svar fra hello', data);
    }
    return HelloResult.fromMap(data);
  }
}