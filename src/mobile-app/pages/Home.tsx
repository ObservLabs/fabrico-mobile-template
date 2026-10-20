import { useCallback, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';

// The app's own URL, which also serves /api in development (Metro proxies it to the worker).
// Empty on the published web build, so calls go to the same origin.
const APP_URL = process.env.EXPO_PUBLIC_APP_URL ?? '';

export default function Home() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sayHello = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${APP_URL}/api/hello`);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      setMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-white p-8">
      <View className="items-center gap-3">
        <Text className="text-4xl font-bold text-center">Welcome to Fabrico</Text>
        <Text className="text-base text-gray-500 text-center">Your app will appear here</Text>
      </View>

      <View className="items-center gap-3 mt-10">
        <Pressable
          className="bg-blue-600 rounded-lg px-6 py-3 items-center"
          onPress={sayHello}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Ping the backend</Text>
          )}
        </Pressable>

        {message && <Text className="text-green-600 text-base">{message}</Text>}
        {error && <Text className="text-red-600 text-base">{error}</Text>}
      </View>
    </View>
  );
}
