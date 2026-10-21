import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// The app's own URL, which also serves /api in development (Metro proxies it to the worker).
// Empty on the published web build, so calls go to the same origin.
const APP_URL = process.env.EXPO_PUBLIC_APP_URL ?? '';

const FEATURES = [
  { title: 'Live on your phone', body: 'Open it in Expo Go and every change reloads as it is made.' },
  { title: 'Backend included', body: 'A Hono API on Cloudflare Workers, already wired to /api.' },
  { title: 'Cloud built in', body: 'Sign-in, database, storage and AI from Fabrico Cloud.' },
] as const;

type ApiStatus =
  | { state: 'checking' }
  | { state: 'connected'; ms: number }
  | { state: 'offline'; message: string };

/** A slow endless 0 → 1 → 0 loop. Stays still when the phone asks for reduced motion. */
function useBreath(duration: number, delay = 0) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [reduceMotion, duration, delay, progress]);
  return progress;
}

/** A hairline ring that slowly breathes outwards. Structure, not a glow. */
function Ring({ size, index }: { size: number; index: number }) {
  const progress = useBreath(3600, index * 600);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.6, 0.15]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.08]) }],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', width: size, height: size, pointerEvents: 'none' }, style]}>
      <View className="h-full w-full rounded-full border border-border" />
    </Animated.View>
  );
}

/** The brand mark: springs in, then floats; three rings breathe behind it. */
function Mark() {
  const float = useBreath(2800);
  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(float.value, [0, 1], [3, -3]) }],
  }));
  return (
    <View className="h-56 w-56 items-center justify-center">
      {[0, 1, 2].map((i) => (
        <Ring key={i} index={i} size={116 + i * 46} />
      ))}
      {/* Entrance and float on separate views: both animate transform. */}
      <Animated.View entering={ZoomIn.delay(80).springify().damping(14)}>
        <Animated.View style={floatStyle}>
          <View className="h-24 w-24 items-center justify-center rounded-[28px] bg-primary">
            <Text className="text-[46px] font-bold text-primary-foreground">F</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/** Dot that pulses while the API is being checked, then holds its colour. */
function StatusDot({ state }: { state: ApiStatus['state'] }) {
  const pulse = useBreath(800);
  const style = useAnimatedStyle(() => ({
    opacity: state === 'checking' ? interpolate(pulse.value, [0, 1], [1, 0.25]) : 1,
  }));
  const colour = state === 'connected' ? 'bg-primary' : state === 'offline' ? 'bg-destructive' : 'bg-muted-foreground';
  return (
    <Animated.View style={style}>
      <View className={`h-2.5 w-2.5 rounded-full ${colour}`} />
    </Animated.View>
  );
}

/** Pressable that gives a little under the thumb. */
function PressableScale({
  onPress,
  disabled,
  label,
  children,
}: {
  onPress: () => void;
  disabled?: boolean;
  label: string;
  children: ReactNode;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={style}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 15 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15 });
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const STATUS_LABEL: Record<ApiStatus['state'], string> = {
  checking: 'Connecting to your API…',
  connected: 'API connected',
  offline: 'API not reachable',
};

export default function Home() {
  const [api, setApi] = useState<ApiStatus>({ state: 'checking' });

  const checkApi = useCallback(async () => {
    setApi({ state: 'checking' });
    const started = Date.now();
    try {
      const res = await fetch(`${APP_URL}/api/hello`);
      if (!res.ok) throw new Error(`The API answered ${res.status}.`);
      const data: unknown = await res.json();
      if (typeof data !== 'object' || data === null || !('message' in data)) {
        throw new Error('The API answered, but not with what this screen expects.');
      }
      setApi({ state: 'connected', ms: Date.now() - started });
    } catch (err) {
      setApi({ state: 'offline', message: err instanceof Error ? err.message : 'The API did not answer.' });
    }
  }, []);

  useEffect(() => {
    checkApi();
  }, [checkApi]);

  const checking = api.state === 'checking';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <ScrollView contentContainerClassName="flex-grow items-center px-6 pb-10 pt-4">
        <Mark />

        <Animated.View entering={FadeInDown.delay(260).duration(600)}>
          <Text className="text-center text-[34px] font-bold leading-[40px] text-foreground">
            Your app starts here
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(380).duration(600)}>
          <Text className="mt-3 max-w-[320px] text-center text-[16px] leading-[23px] text-muted-foreground">
            Describe what you want in Fabrico. The screens, the data and sign-in appear right here, on the web and
            on your phone.
          </Text>
        </Animated.View>

        <View className="mt-10 w-full max-w-md gap-3">
          {FEATURES.map((feature, i) => (
            <Animated.View key={feature.title} entering={FadeInUp.delay(500 + i * 110).duration(550)}>
              <View className="flex-row items-start gap-4 rounded-2xl border border-border bg-card p-4">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-secondary">
                  <Text
                    className="text-[13px] font-bold text-secondary-foreground"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[16px] font-semibold text-card-foreground">{feature.title}</Text>
                  <Text className="mt-1 text-[14px] leading-[20px] text-muted-foreground">{feature.body}</Text>
                </View>
              </View>
            </Animated.View>
          ))}
        </View>

        <View className="mt-6 w-full max-w-md">
          <Animated.View entering={FadeInUp.delay(880).duration(550)}>
            <View className="rounded-2xl border border-border bg-card p-4">
              <View className="flex-row items-center gap-3">
                <StatusDot state={api.state} />
                <Text className="flex-1 text-[15px] font-semibold text-card-foreground" accessibilityLiveRegion="polite">
                  {STATUS_LABEL[api.state]}
                </Text>
                {api.state === 'connected' && (
                  <Text className="text-[13px] text-muted-foreground" style={{ fontVariant: ['tabular-nums'] }}>
                    {api.ms} ms
                  </Text>
                )}
              </View>
              {api.state === 'offline' && (
                <Text className="mt-2 text-[13px] leading-[18px] text-muted-foreground">{api.message}</Text>
              )}
              <PressableScale onPress={checkApi} disabled={checking} label="Check the API again">
                <View
                  className={`mt-4 min-h-[48px] items-center justify-center rounded-xl ${checking ? 'bg-muted' : 'bg-primary'}`}
                >
                  <Text
                    className={`text-[16px] font-semibold ${checking ? 'text-muted-foreground' : 'text-primary-foreground'}`}
                  >
                    {checking ? 'Checking…' : 'Check again'}
                  </Text>
                </View>
              </PressableScale>
            </View>
          </Animated.View>
        </View>

        <View className="mt-auto">
          <Animated.View entering={FadeIn.delay(1100).duration(800)}>
            <Text className="pt-10 text-center text-[12px] text-muted-foreground">Made with Fabrico</Text>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
