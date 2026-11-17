import 'package:flutter/foundation.dart';

enum BackendEnv { emulator, prod }

class BackendConfig {
  const BackendConfig({required this.env, required this.emulatorHost});

  final BackendEnv env;
  final String emulatorHost;

  bool get isEmulator => env == BackendEnv.emulator;

  /// Reads --dart-define=INNHOPP_ENV and --dart-define=EMULATOR_HOST.
  factory BackendConfig.fromEnvironment() {
    const envName = String.fromEnvironment('INNHOPP_ENV', defaultValue: 'emulator');
    const hostOverride = String.fromEnvironment('EMULATOR_HOST');
    return BackendConfig(
      env: BackendEnv.values.byName(envName),
      emulatorHost: hostOverride.isNotEmpty
          ? hostOverride
          : defaultEmulatorHost(isWeb: kIsWeb, platform: defaultTargetPlatform),
    );
  }

  @override
  String toString() => 'BackendConfig(env: $env, emulatorHost: $emulatorHost)';
}

/// Android emulators reach the host machine via 10.0.2.2. Web, the iOS
/// simulator and desktop use the loopback address.
String defaultEmulatorHost({required bool isWeb, required TargetPlatform platform}) {
  if (!isWeb && platform == TargetPlatform.android) return '10.0.2.2';
  return '127.0.0.1';
}