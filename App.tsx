import './global.css';
import { useColorScheme } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { FabricoProvider } from "@fabrico/sdk/react";
import { fabrico } from "./src/mobile-app/lib/fabrico";
import Home from "./src/mobile-app/pages/Home";

const Stack = createNativeStackNavigator();

export default function App() {
  // Headers and screen backgrounds follow the phone's light/dark setting, like the tokens do.
  const scheme = useColorScheme();

  return (
    // FabricoProvider stays off until @fabrico/sdk ships React Native support: the published
    // version reads localStorage, which does not exist on a phone, and crashes at startup.
    // <FabricoProvider client={fabrico}>
      <SafeAreaProvider>
        <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack.Navigator>
            <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    // </FabricoProvider>
  );
}
