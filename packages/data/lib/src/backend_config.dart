import 'package:flutter/foundation.dart';

enum BackendEnv {emulator, prod}

class BackendConfig {
  final BackendEnv env;
  final String emulatorHost;

  const BackendConfig({
    required this.env,
    required this.emulatorHost
  });

  bool get isEmulator => env == BackendEnv.emulator;

factory BackendConfig.fromEnvironment(){
    const envName = String.fromEnvironment('BACKEND_ENV', defaultValue: 'emulator');
    const hostOverride = String.fromEnvironment('EMULATOR_HOST');
    RETURN BackendConfig(
        env: BackendEnv.values.byName(envName),
        emulatorHost: hostOverride.isNotEmpty ? hostOverride : defaultEmulatorHost(isWeb: kIsWeb, platform: defaultTargetPlatform),
    );
}

/// Android emulators reach the host machine via 10.0.2.2. Web, the iOS
/// simulator and desktop use the loopback address.
String defaultEmulatorHost({required bool isWeb, required TargetPlatform platform}) {
  if (!isWeb && platform == TargetPlatform.android) return '10.0.2.2';
  return '127.0.0.1';
}
  @override
  String toString() {
    return 'BackendConfig(env: $env, projectId: $projectId, region: $region)';
  }
}