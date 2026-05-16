import { LanguageCode } from '@vendure/core';

export const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hour = String(Math.floor(i / 2)).padStart(2, '0');
    const minute = i % 2 === 0 ? '00' : '30';
    const time = `${hour}:${minute}`;
    return {
        value: time,
        label: [
            { languageCode: LanguageCode.en, value: time },
            { languageCode: LanguageCode.pt, value: time },
            { languageCode: LanguageCode.pt_PT, value: time },
        ],
    };
});
