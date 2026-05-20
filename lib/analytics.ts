// Thin wrapper around PostHog. Safe to call before init — events are queued.
// If NEXT_PUBLIC_POSTHOG_KEY is not set, all calls are no-ops.

let initialised = false;

async function init() {
  if (initialised) return;
  if (typeof window === 'undefined') return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  const { default: posthog } = await import('posthog-js');
  if (!posthog.__loaded) {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      persistence: 'localStorage',
      capture_pageview: true,
      autocapture: false,
    });
  }
  initialised = true;
}

export async function track(event: string, properties?: Record<string, unknown>) {
  await init();
  if (typeof window === 'undefined') return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  const { default: posthog } = await import('posthog-js');
  posthog.capture(event, properties);
}
