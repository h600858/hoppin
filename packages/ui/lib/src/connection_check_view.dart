import 'package:domain/domain.dart';
import 'package:flutter/material.dart';

/// Temporary start screen: proves the app reaches the backend.
/// Replaced by the real screens in step 6 and 9.
class ConnectionCheckView extends StatefulWidget {
  const ConnectionCheckView({super.key, required this.service, required this.appName});

  final HelloService service;
  final String appName;

  @override
  State<ConnectionCheckView> createState() => _ConnectionCheckViewState();
}

class _ConnectionCheckViewState extends State<ConnectionCheckView> {
  late Future<HelloResult> _result;

  @override
  void initState() {
    super.initState();
    _result = widget.service.hello(name: widget.appName);
  }

  void _retry() {
    setState(() {
      _result = widget.service.hello(name: widget.appName);
    });
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(title: Text(widget.appName)),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: FutureBuilder<HelloResult>(
            future: _result,
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return const CircularProgressIndicator();
              }
              if (snapshot.hasError) {
                return Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('Fikk ikke kontakt med backend', style: text.titleLarge),
                    const SizedBox(height: 8),
                    Text(snapshot.error.toString(), style: text.bodyMedium),
                    const SizedBox(height: 16),
                    ElevatedButton(onPressed: _retry, child: const Text('Prøv igjen')),
                  ],
                );
              }
              final result = snapshot.requireData;
              return Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(result.message, style: text.headlineMedium),
                  const SizedBox(height: 8),
                  Text('Region: ${result.region}', style: text.bodyMedium),
                  Text('Tjenertid: ${result.serverTime.toLocal()}', style: text.bodyMedium),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}