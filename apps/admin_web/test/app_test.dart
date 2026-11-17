import 'package:domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:admin_web/main.dart';

class _FakeHelloService implements HelloService {
  @override
  Future<HelloResult> hello({String? name}) async => HelloResult(
    message: 'Hei, $name!',
    region: 'europe-north1',
    serverTime: DateTime.utc(2026, 11, 17),
  );
}

void main() {
  testWidgets('app starts and greets the backend', (tester) async {
    await tester.pumpWidget(AdminApp(helloService: _FakeHelloService()));
    await tester.pumpAndSettle();
    expect(find.text('Hei, Innhopp admin!'), findsOneWidget);
  });
}
