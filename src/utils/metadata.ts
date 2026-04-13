import type { MetadataField } from '@/types';

export const parseMetadata = (
  metadata: string | { fields: MetadataField[] } | null | undefined
): { fields: MetadataField[] } => {
  if (!metadata) return { fields: [] };
  
  if (typeof metadata === 'string') {
    try {
      let cleaned: any = metadata;
      while (typeof cleaned === 'string' && cleaned.startsWith('"')) {
        try {
          cleaned = JSON.parse(cleaned);
        } catch { break; }
      }
      if (typeof cleaned === 'string') {
        cleaned = JSON.parse(cleaned);
      }
      if (cleaned && typeof cleaned === 'object' && Array.isArray(cleaned.fields)) {
        return cleaned as { fields: MetadataField[] };
      }
      return { fields: [] };
    } catch { return { fields: [] }; }
  }
  return metadata;
};
