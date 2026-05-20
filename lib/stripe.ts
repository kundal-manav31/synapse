import Stripe from 'stripe';

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? '';
  return key.startsWith('sk_');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
});
