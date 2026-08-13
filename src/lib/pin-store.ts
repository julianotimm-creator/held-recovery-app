/**
 * Local PIN vault (frontend only).
 *
 * The 4-digit PIN chosen by the user is never stored in plain text: we keep a
 * random salt plus the SHA-256 digest of `salt:pin` in localStorage.
 */

const KEY_PREFIX = "held.pin.";
const BIO_PREFIX = "held.pin.bio.";

type StoredPin = { salt: string; hash: string };

function storage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function digest(salt: string, pin: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return toHex(hash);
}

function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes.buffer);
}

export function hasPin(userKey: string): boolean {
  const store = storage();
  if (!store) return false;
  return !!store.getItem(KEY_PREFIX + userKey);
}

export async function savePin(userKey: string, pin: string): Promise<void> {
  const store = storage();
  if (!store) return;
  const salt = randomSalt();
  const payload: StoredPin = { salt, hash: await digest(salt, pin) };
  store.setItem(KEY_PREFIX + userKey, JSON.stringify(payload));
}

export async function verifyPin(userKey: string, pin: string): Promise<boolean> {
  const store = storage();
  if (!store) return false;
  const raw = store.getItem(KEY_PREFIX + userKey);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as StoredPin;
    return (await digest(parsed.salt, pin)) === parsed.hash;
  } catch {
    return false;
  }
}

export function clearPin(userKey: string): void {
  const store = storage();
  if (!store) return;
  store.removeItem(KEY_PREFIX + userKey);
  store.removeItem(BIO_PREFIX + userKey);
}

export function isBiometricEnrolled(userKey: string): boolean {
  const store = storage();
  return !!store?.getItem(BIO_PREFIX + userKey);
}

export async function isBiometricAvailable(): Promise<boolean> {
  try {
    if (typeof window === "undefined" || !window.PublicKeyCredential) return false;
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** Registers a platform credential (Face ID / fingerprint) for this device. */
export async function enrollBiometric(userKey: string): Promise<boolean> {
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = new TextEncoder().encode(userKey);
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: "HELD", id: window.location.hostname },
        user: { id: userId, name: userKey, displayName: "HELD" },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;
    if (!cred) return false;
    storage()?.setItem(BIO_PREFIX + userKey, cred.id);
    return true;
  } catch {
    return false;
  }
}

/** Prompts Face ID / fingerprint for an already enrolled device. */
export async function verifyBiometric(userKey: string): Promise<boolean> {
  const store = storage();
  const id = store?.getItem(BIO_PREFIX + userKey);
  if (!id) return false;
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const raw = Uint8Array.from(atob(id.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
      c.charCodeAt(0),
    );
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ type: "public-key", id: raw }],
        userVerification: "required",
        timeout: 60000,
      },
    });
    return !!assertion;
  } catch {
    return false;
  }
}
