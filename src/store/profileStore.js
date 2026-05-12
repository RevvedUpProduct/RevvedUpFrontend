import {create} from 'zustand';
import {readJSON, writeJSON, STORAGE_KEYS} from '@services/storage';

export const DEFAULT_PROFILE = {
  displayName: 'Rahul Kumar',
  email: 'rahul.kumar@email.com',
};

export const DEFAULT_GARAGE = {
  bikes: [
    {
      id: 'bike-1',
      name: 'Royal Enfield Classic 350',
      year: 2022,
      plate: 'DL 8C AB 1234',
      isPrimary: true,
      documents: [
        {
          id: 'doc-1',
          title: 'Registration (RC)',
          status: 'valid',
          subtitle: 'Valid until Dec 2026',
          icon: 'file-document-outline',
        },
        {
          id: 'doc-2',
          title: 'Insurance',
          status: 'expiring',
          subtitle: 'Expires 15 Jun 2025',
          icon: 'shield-check-outline',
        },
        {
          id: 'doc-3',
          title: 'Pollution (PUC)',
          status: 'valid',
          subtitle: 'Valid until Jan 2027',
          icon: 'leaf',
        },
      ],
    },
    {
      id: 'bike-2',
      name: 'Yamaha FZ-S V3',
      year: 2019,
      plate: 'HR 26 CD 5678',
      isPrimary: false,
      documents: [
        {
          id: 'doc-4',
          title: 'Registration (RC)',
          status: 'valid',
          subtitle: 'Valid until Mar 2027',
          icon: 'file-document-outline',
        },
        {
          id: 'doc-5',
          title: 'Insurance',
          status: 'valid',
          subtitle: 'Valid until Aug 2026',
          icon: 'shield-check-outline',
        },
      ],
    },
  ],
};

export const DEFAULT_EMERGENCY = {
  contacts: [
    {
      id: 'c-1',
      name: 'Priya Kumar',
      relation: 'Spouse',
      phone: '+91 98765 43210',
    },
    {
      id: 'c-2',
      name: 'Dr. Amit Verma',
      relation: 'Family doctor',
      phone: '+91 98100 11223',
    },
  ],
  bloodGroup: 'O+',
  allergies: ['Penicillin', 'Dust mites'],
  medications: ['Vitamin D — weekly', 'Losartan 25mg — daily'],
  conditions: ['Mild asthma (controlled)'],
};

export const DEFAULT_RIDER_GEAR = {
  equipment: [
    {
      id: 'eq-1',
      name: 'Full-face helmet',
      model: 'Shoei RF-1400',
      status: 'good',
      statusLabel: 'Checked',
      checkedDate: '2026-04-18',
      icon: 'motorbike-helmet',
    },
    {
      id: 'eq-2',
      name: 'Riding jacket',
      model: 'Dainese Super Speed',
      status: 'good',
      statusLabel: 'Checked',
      checkedDate: '2026-04-01',
      icon: 'tshirt-crew-outline',
    },
    {
      id: 'eq-3',
      name: 'Gloves',
      model: 'Alpinestars GP Pro',
      status: 'replace',
      statusLabel: 'Replace soon',
      checkedDate: '2025-11-10',
      icon: 'hand-back-right-outline',
    },
  ],
  intercom: {
    deviceName: 'Sena 50S',
    batteryPct: 78,
    rangeM: 2000,
    paired: ['Helmet 1', 'Phone'],
  },
};

function ensureJSON(key, fallback) {
  const raw = readJSON(key);
  if (raw == null) {
    writeJSON(key, fallback);
    return fallback;
  }
  return raw;
}

export const useProfileStore = create((set, get) => ({
  profile: DEFAULT_PROFILE,
  garage: DEFAULT_GARAGE,
  emergency: DEFAULT_EMERGENCY,
  riderGear: DEFAULT_RIDER_GEAR,

  hydrate: () => {
    const profile = ensureJSON(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
    const garage = ensureJSON(STORAGE_KEYS.GARAGE, DEFAULT_GARAGE);
    const emergency = ensureJSON(STORAGE_KEYS.EMERGENCY, DEFAULT_EMERGENCY);
    const riderGear = ensureJSON(STORAGE_KEYS.RIDER_GEAR, DEFAULT_RIDER_GEAR);
    set({profile, garage, emergency, riderGear});
  },

  setProfile: patch => {
    const next = {...get().profile, ...patch};
    writeJSON(STORAGE_KEYS.PROFILE, next);
    set({profile: next});
  },

  setGarage: garage => {
    writeJSON(STORAGE_KEYS.GARAGE, garage);
    set({garage});
  },

  setEmergency: emergency => {
    writeJSON(STORAGE_KEYS.EMERGENCY, emergency);
    set({emergency});
  },

  setRiderGear: riderGear => {
    writeJSON(STORAGE_KEYS.RIDER_GEAR, riderGear);
    set({riderGear});
  },

  /** Sign out: reset profile-related blobs only; ride history is untouched. */
  resetProfileBundleToDefaults: () => {
    writeJSON(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
    writeJSON(STORAGE_KEYS.GARAGE, DEFAULT_GARAGE);
    writeJSON(STORAGE_KEYS.EMERGENCY, DEFAULT_EMERGENCY);
    writeJSON(STORAGE_KEYS.RIDER_GEAR, DEFAULT_RIDER_GEAR);
    set({
      profile: DEFAULT_PROFILE,
      garage: DEFAULT_GARAGE,
      emergency: DEFAULT_EMERGENCY,
      riderGear: DEFAULT_RIDER_GEAR,
    });
  },
}));
