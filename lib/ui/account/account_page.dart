import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../state/store_state.dart';

class AccountPage extends StatefulWidget {
  const AccountPage({super.key});

  @override
  State<AccountPage> createState() => _AccountPageState();
}

class _AccountPageState extends State<AccountPage> {
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  bool _isLoginMode = true;

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _email.dispose();
    _phone.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<StoreState>();

    if (state.isLoggedIn) {
      final customer = state.customer ?? const {};
      return ListView(
        padding: const EdgeInsets.all(12),
        children: [
          Card(
            child: ListTile(
              leading: const CircleAvatar(child: Icon(Icons.person)),
              title: Text((customer['email'] ?? state.customerEmail).toString()),
              subtitle: Text(
                '${customer['first_name'] ?? ''} ${customer['last_name'] ?? ''}'.trim(),
              ),
            ),
          ),
          const SizedBox(height: 10),
          FilledButton.tonalIcon(
            onPressed: state.loadCustomer,
            icon: const Icon(Icons.refresh),
            label: const Text('Refresh profile'),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: state.logout,
            icon: const Icon(Icons.logout),
            label: const Text('Logout'),
          ),
          if (state.error != null) ...[
            const SizedBox(height: 8),
            Text(state.error!, style: const TextStyle(color: Colors.red)),
          ],
        ],
      );
    }

    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _isLoginMode ? 'Sign in' : 'Create account',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                if (!_isLoginMode) ...[
                  TextField(
                    controller: _firstName,
                    decoration: const InputDecoration(labelText: 'First name'),
                  ),
                  TextField(
                    controller: _lastName,
                    decoration: const InputDecoration(labelText: 'Last name'),
                  ),
                  TextField(
                    controller: _phone,
                    decoration: const InputDecoration(labelText: 'Phone'),
                  ),
                ],
                TextField(
                  controller: _email,
                  decoration: const InputDecoration(labelText: 'Email'),
                ),
                TextField(
                  controller: _password,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'Password'),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: state.loading
                        ? null
                        : () async {
                            if (_isLoginMode) {
                              await state.loginWithEmail(
                                email: _email.text.trim(),
                                password: _password.text,
                              );
                            } else {
                              await state.registerAndLogin(
                                firstName: _firstName.text.trim(),
                                lastName: _lastName.text.trim(),
                                email: _email.text.trim(),
                                phone: _phone.text.trim(),
                                password: _password.text,
                              );
                            }
                          },
                    child: Text(_isLoginMode ? 'Login' : 'Register'),
                  ),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: state.loading ? null : state.loginWithGoogle,
                    icon: const Icon(Icons.account_circle_outlined),
                    label: const Text('Continue with Google'),
                  ),
                ),
                TextButton(
                  onPressed: () => setState(() => _isLoginMode = !_isLoginMode),
                  child: Text(
                    _isLoginMode
                        ? 'New customer? Create account'
                        : 'Already have account? Login',
                  ),
                ),
                if (state.error != null)
                  Text(state.error!, style: const TextStyle(color: Colors.red)),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
