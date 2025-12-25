
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
    "version": "v2.5.5",
    "date": "26.12.2025",
    "isLatest": true,
    "changes": {
      "en": [
        "Added support for two languages ​​(RU/EN)",
        "Added Vocab Laboratory"
      ],
      "ru": [
        "Добавлена поддержка двух языков (RU/EN)",
        "Добавлена Лаборатория лексики"
      ]
    }
  },
  {
    "version": "v2.5.0",
    "date": "23.12.2025",
    "isLatest": false,
    "changes": {
      "en": [
        "Test"
      ],
      "ru": [
        "Тест"
      ]
    }
  }
];
