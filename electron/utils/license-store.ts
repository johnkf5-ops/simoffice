/**
 * License Store (Main Process)
 * Separate electron-store instance for license data
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let licenseStoreInstance: any = null;

interface LicenseData {
  key: string | null;
  status: string | null;
  validUntil: number | null;
  email: string | null;
}

async function getLicenseStore() {
  if (!licenseStoreInstance) {
    const Store = (await import('electron-store')).default;
    licenseStoreInstance = new Store<LicenseData>({
      name: 'license',
      defaults: {
        key: null,
        status: null,
        validUntil: null,
        email: null,
      },
    });
  }
  return licenseStoreInstance;
}

export async function getLicenseData(): Promise<LicenseData> {
  const store = await getLicenseStore();
  return {
    key: store.get('key', null),
    status: store.get('status', null),
    validUntil: store.get('validUntil', null),
    email: store.get('email', null),
  };
}

export async function setLicenseKey(key: string): Promise<void> {
  const store = await getLicenseStore();
  store.set('key', key);
}

export async function cacheLicenseValidation(status: string, validUntil: number, email: string | null): Promise<void> {
  const store = await getLicenseStore();
  store.set('status', status);
  store.set('validUntil', validUntil);
  if (email) store.set('email', email);
}

export async function clearLicenseData(): Promise<void> {
  const store = await getLicenseStore();
  store.clear();
}
