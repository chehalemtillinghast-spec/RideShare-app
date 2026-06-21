import { api } from './api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function getPushSubscription() {
  if (!(await isPushSupported())) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function enablePush() {
  if (!(await isPushSupported())) {
    throw new Error('Push notifications are not supported on this browser.');
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }
  const { publicKey } = await api.get('/push/vapid-public-key');
  if (!publicKey) {
    throw new Error('Push notifications are not configured on the server yet.');
  }
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
  const json = subscription.toJSON();
  await api.post('/push/subscribe', { endpoint: json.endpoint, keys: json.keys });
  return subscription;
}

export async function disablePush() {
  const subscription = await getPushSubscription();
  if (!subscription) return;
  await api.post('/push/unsubscribe', { endpoint: subscription.endpoint });
  await subscription.unsubscribe();
}
