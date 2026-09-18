import { View, Text, TextInput, Pressable } from 'react-native';

export default function SignIn() {
  return (
    <View className="flex-1 items-center justify-center p-8 bg-white">
      <Text className="text-3xl font-bold mb-6">Sign In</Text>
      <TextInput 
        className="w-full border border-gray-300 rounded-lg p-4 mb-4" 
        placeholder="Email" 
      />
      <TextInput 
        className="w-full border border-gray-300 rounded-lg p-4 mb-6" 
        placeholder="Password" 
        secureTextEntry 
      />
      <Pressable className="w-full bg-blue-600 rounded-lg p-4 items-center">
        <Text className="text-white font-bold text-lg">Sign In</Text>
      </Pressable>
    </View>
  );
}
