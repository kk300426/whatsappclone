import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  authPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0b7b63',
  },

  authCard: {
    width: '90%',
    maxWidth: 480,
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 32,
    elevation: 8,
  },

  authBrand: {
    alignItems: 'center',
    marginBottom: 28,
  },

  authHero: {
    width: 240,
    height: 240,
    borderRadius: 28,
    marginBottom: 18,
  },

  authTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#075e54',
    textAlign: 'center',
    marginBottom: 22,
  },

  authInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#d8e3dd',
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f8faf8',
    fontSize: 16,
    marginBottom: 16,
  },

  authButton: {
    width: '100%',
    height: 50,
    borderRadius: 16,
    backgroundColor: '#25d366',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },

  authButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },

  authFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },

  authFooterText: {
    color: '#385248',
    fontSize: 15,
  },

  authLink: {
    color: '#075e54',
    fontWeight: '700',
    marginLeft: 5,
  },

  align: {
    width: '90%',
    backgroundColor: '#ffffff',
    padding: 30,
    borderRadius: 15,
    elevation: 5,
    alignSelf: 'center',
    marginTop: 70,
  },

  username: {
    width: '100%',
    height: 45,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },

  email: {
    width: '100%',
    height: 45,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },

  newPassword: {
    width: '100%',
    height: 45,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },

  confirmPassword: {
    width: '100%',
    height: 45,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },

  registerButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#25D366',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});