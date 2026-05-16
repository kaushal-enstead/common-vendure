import { LanguageCode } from '@vendure/core';

export const validateLongitude = (value: any) => {
    if (value == null || isNaN(value)) {
        return [
            { languageCode: LanguageCode.en, value: 'Longitude must be a number' },
            { languageCode: LanguageCode.pt, value: 'A longitude deve ser um número' },
            { languageCode: LanguageCode.pt_PT, value: 'A longitude deve ser um número' },
        ];
    }
    if (value < -180 || value > 180) {
        return [
            { languageCode: LanguageCode.en, value: 'Longitude must be between -180 and 180' },
            { languageCode: LanguageCode.pt, value: 'A longitude deve estar entre -180 e 180' },
            { languageCode: LanguageCode.pt_PT, value: 'A longitude deve estar entre -180 e 180' },
        ];
    }
    return undefined;
};

export const validateLatitude = (value: any) => {
    if (value == null || isNaN(value)) {
        return [
            { languageCode: LanguageCode.en, value: 'Latitude must be a number' },
            { languageCode: LanguageCode.pt, value: 'A latitude deve ser um número' },
            { languageCode: LanguageCode.pt_PT, value: 'A latitude deve ser um número' },
        ];
    }
    if (value < -90 || value > 90) {
        return [
            { languageCode: LanguageCode.en, value: 'Latitude must be between -90 and 90' },
            { languageCode: LanguageCode.pt, value: 'A latitude deve estar entre -90 e 90' },
            { languageCode: LanguageCode.pt_PT, value: 'A latitude deve estar entre -90 e 90' },
        ];
    }
    return undefined;
};
