import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';

import 'backend_config.dart';

const _region = 'europe-north1';

// Fake values are fine: "demo-" projects never reach Google.
const _demoOptions = FirebaseOptions(
  apiKey: 'demo-api-key',
  appId: '1:000000000000:android:0000000000000000',
  messagingSenderId: '000000000000',
  projectId: 'demo-innhopp',
);

class InnhoppBackend {
  InnhoppBackend._();

  /// Always use this instance: callables live in europe-north1, and the
  /// default instance would look in us-central1.
  static FirebaseFunctions get functions =>
      FirebaseFunctions.instanceFor(region: _region);

  static Future<void> init(BackendConfig config) async {
    switch (config.env) {
      case BackendEnv.prod:
        throw UnsupportedError('Ekte Firebase-prosjekt kobles på i steg 12.');
      case BackendEnv.emulator:
        await Firebase.initializeApp(options: _demoOptions);
        final host = config.emulatorHost;
        await FirebaseAuth.instance.useAuthEmulator(host, 9099);
        FirebaseFirestore.instance.useFirestoreEmulator(host, 8080);
        functions.useFunctionsEmulator(host, 5001);
    }
  }
}