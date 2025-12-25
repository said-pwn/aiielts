
export interface SystemUpdate {
  version: string;
  date: string;
  isLatest: boolean;
  changes: {
    en: string[];
    ru: string[];
  };
}

export const updatesData: SystemUpdate[] = [
  {
    "version": "v2.5.0",
    "date": "25.12.2025",
    "isLatest": true,
    "changes": {
      "en": [
        "test"
      ],
      "ru": [
        "test"
      ]
    }
  }
];
