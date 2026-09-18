import './global.css';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FabricoProvider } from "@fabrico/sdk/react";
import { fabrico } from "./src/mobile-app/lib/fabrico";
import Home from "./src/mobile-app/pages/Home";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    // <FabricoProvider client={fabrico}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={Home} />
        </Stack.Navigator>
      </NavigationContainer>
    // </FabricoProvider>
  );
}
