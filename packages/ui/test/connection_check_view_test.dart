import 'package:domain/domain.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ui/ui.dart';

class _FakeHelloService implements HelloService {
  _FakeHelloService(this._answer);

  final Future<HelloResult> Function() _answer;
  int calls = 0;

  @override
  Future<HelloResult> hello({String? name}) {
    calls++;
    return _answer();
  }
}

final _ok = HelloResult(
  message: 'Hei, Test!',
  region: 'europe-north1',
  serverTime: DateTime.utc(2026, 11, 17, 6, 40),
);

Widget _wrap(HelloService service) =>
    MaterialApp(home: ConnectionCheckView(service: service, appName: 'Test'));

void main() {
  testWidgets('shows the greeting from the backend', (tester) async {
    await tester.pumpWidget(_wrap(_FakeHelloService(() async => _ok)));
    await tester.pumpAndSettle();

    expect(find.text('Hei, Test!'), findsOneWidget);
    expect(find.text('Region: europe-north1'), findsOneWidget);
  });

  testWidgets('shows an error and recovers on retry', (tester) async {
    var fail = true;
    final service = _FakeHelloService(() async {
      if (fail) throw Exception('nede');
      return _ok;
    });

    await tester.pumpWidget(_wrap(service));
    await tester.pumpAndSettle();
    expect(find.text('Fikk ikke kontakt med backend'), findsOneWidget);

    fail = false;
    await tester.tap(find.text('Prøv igjen'));
    await tester.pumpAndSettle();

    expect(find.text('Hei, Test!'), findsOneWidget);
    expect(service.calls, 2);
  });
}