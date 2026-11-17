import 'package:data/data.dart';
import 'package:domain/domain.dart';
import 'package:flutter/material.dart';
import 'package:ui/ui.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await InnhoppBackend.init(BackendConfig.fromEnvironment());
  runApp(AdminApp(helloService: FirebaseHelloService(InnhoppBackend.functions)));
}


class AdminApp extends StatelessWidget {
  const AdminApp({super.key, required this.helloService});

  final HelloService helloService;

  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Hoppin',
      home: ConnectionCheckView(service: helloService, appName: 'Innhopp admin'),
    );
  }
}
