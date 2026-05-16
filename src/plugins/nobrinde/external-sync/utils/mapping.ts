import { RemoteTableConfig } from '../types';

export const mapFields = (
  tableConfig: RemoteTableConfig,
  input: Record<string, unknown>,
  output: 'vendure' | 'remote' = 'vendure',
): Record<string, unknown> => {
  if (!tableConfig.remoteToVendure || !tableConfig.vendureToRemote) {
    return input;
  }
  const mapping = output === 'vendure' ? tableConfig.remoteToVendure : tableConfig.vendureToRemote;

  // Build result immutably
  return Object.entries(mapping).reduce<Record<string, unknown>>((acc, [sourceKey, targetKey]) => {
    const value = getNestedValue(input, sourceKey);
    if (value === undefined) return acc;

    return setNestedValueImmutable(acc, targetKey, value);
  }, {});
};

export const mapFieldsFromMapping = (
  mapping: Record<string, string>,
  input: Record<string, unknown>,
): Record<string, unknown> => {
  // Build result immutably
  return Object.entries(mapping).reduce<Record<string, unknown>>((acc, [sourceKey, targetKey]) => {
    const value = getNestedValue(input, sourceKey);
    if (value === undefined) return acc;

    return setNestedValueImmutable(acc, targetKey, value);
  }, {});
};

function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

function setNestedValueImmutable(obj: Record<string, any>, path: string, value: any): Record<string, any> {
  const keys = path.split('.');
  const [firstKey, ...rest] = keys;

  if (keys.length === 0) return obj;

  if (keys.length === 1) {
    // Return a new object with this key replaced
    return { ...obj, [firstKey]: value };
  }

  const existingValue = obj[firstKey];
  const updatedNested = setNestedValueImmutable(
    typeof existingValue === 'object' && existingValue !== null ? existingValue : {},
    rest.join('.'),
    value,
  );

  return { ...obj, [firstKey]: updatedNested };
}

// export const mapFields = (
//   tableConfig: RemoteTableConfig,
//   input: Record<string, unknown>,
//   output: 'vendure' | 'remote' = 'vendure',
// ): Record<string, unknown> => {
//   const { vendureToRemote, remoteToVendure } = tableConfig;
//   const mapping = output === 'vendure' ? remoteToVendure : vendureToRemote;

//   const result: Record<string, unknown> = {};

//   for (const [sourceKey, targetKey] of Object.entries(mapping)) {
//     const value = getNestedValue(input, sourceKey);

//     if (value === undefined) continue;

//     setNestedValue(result, targetKey, value);
//   }

//   return result;
// };

// function getNestedValue(obj: Record<string, any>, path: string): any {
//   return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
// }

// function setNestedValue(obj: Record<string, any>, path: string, value: any) {
//   const keys = path.split('.');
//   let current = obj;

//   for (let i = 0; i < keys.length; i++) {
//     const key = keys[i];
//     if (i === keys.length - 1) {
//       current[key] = value;
//     } else {
//       if (!current[key] || typeof current[key] !== 'object') {
//         current[key] = {};
//       }
//       current = current[key];
//     }
//   }
// }
