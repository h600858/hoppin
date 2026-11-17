import 'package:data/data.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('defaultEmulatorHost', () {
    test('Android emulator reaches the host via 10.0.2.2', () {
      expect(
        defaultEmulatorHost(isWeb: false, platform: TargetPlatform.android),
        '10.0.2.2',
      );
    });

    test('web uses loopback', () {
      expect(
        defaultEmulatorHost(isWeb: true, platform: TargetPlatform.windows),
        '127.0.0.1',
      );
    });

    test('iOS simulator uses loopback', () {
      expect(
        defaultEmulatorHost(isWeb: false, platform: TargetPlatform.iOS),
        '127.0.0.1',
      );
    });
  });
}
