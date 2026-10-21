import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  ZoomIn,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { FabricoMark } from '../components/FabricoMark';

/**
 * An endless 0 → 1 loop: back and forth (breathing) or one way (turning).
 * Stays still when the phone asks for reduced motion.
 */
function useLoop(duration: number, { delay = 0, turn = false }: { delay?: number; turn?: boolean } = {}) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    const easing = turn ? Easing.linear : Easing.inOut(Easing.sin);
    progress.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing }), -1, !turn));
  }, [reduceMotion, duration, delay, turn, progress]);
  return progress;
}

/** A hairline ring that slowly breathes outwards. Structure, not a glow. */
function Ring({ size, index }: { size: number; index: number }) {
  const breath = useLoop(3600, { delay: index * 600 });
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(breath.value, [0, 1], [0.6, 0.15]),
    transform: [{ scale: interpolate(breath.value, [0, 1], [1, 1.08]) }],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', width: size, height: size, pointerEvents: 'none' }, style]}>
      <View className="h-full w-full rounded-full border border-border" />
    </Animated.View>
  );
}

/** A small dot that circles the outer ring once every 14 seconds. */
function Orbit({ size }: { size: number }) {
  const turn = useLoop(14000, { turn: true });
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value * 360}deg` }] }));
  return (
    <Animated.View style={[{ position: 'absolute', width: size, height: size, pointerEvents: 'none' }, style]}>
      <View className="absolute -top-[5px] left-1/2 -ml-[5px] h-[10px] w-[10px] rounded-full bg-primary" />
    </Animated.View>
  );
}

/** The Fabrico mark on its tile: springs in, then floats; rings and an orbiting dot around it. */
function Mark() {
  const float = useLoop(2800);
  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(float.value, [0, 1], [4, -4]) }],
  }));
  return (
    <View className="h-64 w-64 items-center justify-center">
      {[0, 1, 2].map((i) => (
        <Ring key={i} index={i} size={136 + i * 50} />
      ))}
      <Orbit size={236} />
      {/* Entrance and float on separate views: both animate transform. */}
      <Animated.View entering={ZoomIn.delay(80).springify().damping(14)}>
        <Animated.View style={floatStyle}>
          <View className="h-28 w-28 items-center justify-center rounded-[32px] bg-primary">
            <FabricoMark size={64} className="text-primary-foreground" />
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/** Three dots pulsing in turn: the app is waiting for your idea. */
function Waiting() {
  return (
    <View className="mt-8 flex-row gap-2">
      {[0, 1, 2].map((i) => (
        <Dot key={i} delay={i * 180} />
      ))}
    </View>
  );
}

function Dot({ delay }: { delay: number }) {
  const pulse = useLoop(700, { delay });
  const style = useAnimatedStyle(() => ({ opacity: interpolate(pulse.value, [0, 1], [0.25, 1]) }));
  return (
    <Animated.View style={style}>
      <View className="h-2 w-2 rounded-full bg-muted-foreground" />
    </Animated.View>
  );
}

export default function Home() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-1 items-center justify-center px-8">
        <Mark />

        <Animated.View entering={FadeInDown.delay(260).duration(650)}>
          <Text className="mt-6 text-center text-[34px] font-bold leading-[40px] text-foreground">
            Your app starts here
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(400).duration(650)}>
          <Text className="mt-3 max-w-[300px] text-center text-[17px] leading-[24px] text-muted-foreground">
            Describe what you want in Fabrico and it will appear right here.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(700).duration(600)}>
          <Waiting />
        </Animated.View>
      </View>

      <Animated.View entering={FadeIn.delay(1000).duration(800)}>
        <Text className="pb-4 text-center text-[12px] text-muted-foreground">Made with Fabrico</Text>
      </Animated.View>
    </SafeAreaView>
  );
}
