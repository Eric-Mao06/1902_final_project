import { View, StyleSheet, Image } from 'react-native';
import { AuthButton } from '../components/AuthButton';
import { useAuth } from '../context/AuthContext';
import { ThemedText } from '@/components/ThemedText';

function AuthScreenContent() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {user ? (
        <View style={styles.userInfo}>
          <ThemedText style={styles.welcomeText}>Welcome, {user.name}!</ThemedText>
          {user.picture && (
            <Image 
              source={{ uri: user.picture }} 
              style={{ width: 50, height: 50, borderRadius: 25, marginBottom: 10 }} 
            />
          )}
          <AuthButton 
            title="Sign Out" 
            onPress={signOut}
          />
        </View>
      ) : (
        <View style={styles.signInContainer}>
          <ThemedText style={styles.welcomeText}>Welcome to Linkd</ThemedText>
          <AuthButton 
            title="Sign In with Google" 
            onPress={signInWithGoogle}
          />
        </View>
      )}
    </View>
  );
}

export default function AuthScreen() {
  return <AuthScreenContent />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  userInfo: {
    alignItems: 'center',
  },
  signInContainer: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 20,
    marginBottom: 20,
  },
});
