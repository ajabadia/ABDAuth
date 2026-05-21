
export interface PIIOptions {
 detectOnly?: boolean;
 placeholder?: string;
 correlationId?: string;
 tenantId?: string;
}

export interface PIIResult {
 originalText: string;
 processedText: string;
 detections: Array<{
 type: string;
 match: string;
 index: number;
 }>;
 metadata: {
 count: number;
 types: string[];
 isClean: boolean;
 };
}

/**
 * PII Masking Engine
 * Detects and optionally masks sensitive personal information.
 * Ported from ABDAgRAG Industrial Stack.
 */
export class PIIMasker {
 private static readonly PATTERNS = {
 EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
 PHONE: /(?:\+?34\s?)?[6789]\d{8}/g,
 INT_PHONE: /\+\d{1,3}\s?\d{4,12}/g,
 DNI_NIE: /[XYZ]?\d{7,8}[A-Z]/gi,
 CREDIT_CARD: /\b(?:\d[ -]??){13,16}\b/g,
 IBAN: /[A-Z]{2}\d{2}(?:\s?\d{4}){5}/gi
 };

  /**
   * Entry point for masking.
   */
  public static async mask(text: string, _tenantId: string = 'SYSTEM', _correlationId: string = 'SYSTEM'): Promise<{
    maskedText: string,
    metadata: { count: number, types: string[], isClean: boolean }
  }> {
    const result = await this.process(text, { detectOnly: false });
    return {
      maskedText: result.processedText,
      metadata: {
        count: result.metadata.count,
        types: result.metadata.types,
        isClean: result.metadata.isClean
      }
    };
  }

 /**
 * Core processing logic.
 */
 private static async process(text: string, options: PIIOptions): Promise<PIIResult> {
  const { detectOnly = false, placeholder = '[MASKED]', tenantId: _tenantId = 'SYSTEM', correlationId: _correlationId = 'SYSTEM' } = options;
 let processedText = text;
 const detections: PIIResult['detections'] = [];
 const detectedTypes = new Set<string>();

 Object.entries(this.PATTERNS).forEach(([type, regex]) => {
 let match;
 const tempRegex = new RegExp(regex);
 while ((match = tempRegex.exec(text)) !== null) {
 detections.push({
 type,
 match: match[0],
 index: match.index
 });
 detectedTypes.add(type);
 }
 });

  if (!detectOnly && detections.length > 0) {
    Object.entries(this.PATTERNS).forEach(([_type, regex]) => {
      processedText = processedText.replace(regex, placeholder);
    });
  }

 const count = detections.length;

 // Silent masking in production.

 return {
 originalText: text,
 processedText,
 detections,
 metadata: {
 count,
 types: Array.from(detectedTypes),
 isClean: count === 0
 }
 };
 }
}
