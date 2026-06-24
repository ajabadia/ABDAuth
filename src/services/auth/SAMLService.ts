/**
 * @purpose Gestiona y extrae atributos del usuario desde una afirmación XML SAML 2.0.
 * @purpose_en Parses and extracts user attributes from a SAML 2.0 XML assertion.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:1,imports:1,sig:16zbyw0
 * @lastUpdated 2026-06-23T23:00:22.697Z
 */

import { XMLParser } from 'fast-xml-parser';

/**
 * 🔐 SAMLService
 * Handles SAML 2.0 XML assertion parsing using fast-xml-parser.
 * Replaces the fragile regex-based parsing in the SAML ACS route.
 */
export class SAMLService {
  private static parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    allowBooleanAttributes: true,
    parseTagValue: true,
    trimValues: true,
    removeNSPrefix: true, // Strip namespace prefixes: <saml:Issuer> → Issuer
    // Disable numeric parsing — all SAML fields are strings
    numberParseOptions: {
      skipLike: /.*/,
      hex: false,
      leadingZeros: false,
    },
  });

  /**
   * Parse raw SAML XML into a structured JSON object (namespace-agnostic).
   */
  static parse(samlXml: string): Record<string, unknown> {
    return this.parser.parse(samlXml) as Record<string, unknown>;
  }

  /**
   * Extract the Issuer entity ID from a SAML Response/Assertion.
   */
  static extractIssuer(samlXml: string): string {
    const parsed = this.parse(samlXml);

    // Try: Response > Issuer
    const response = parsed['Response'] as Record<string, unknown> | undefined;
    if (response?.Issuer && typeof response.Issuer === 'string') {
      return response.Issuer;
    }

    // Try: Response > Assertion > Issuer
    const assertion = response?.Assertion as Record<string, unknown> | undefined;
    if (assertion?.Issuer && typeof assertion.Issuer === 'string') {
      return assertion.Issuer;
    }

    // Try: Assertion directly as root (some IdPs send just the assertion)
    if (parsed['Assertion']) {
      const rootAssertion = parsed['Assertion'] as Record<string, unknown>;
      if (rootAssertion.Issuer && typeof rootAssertion.Issuer === 'string') {
        return rootAssertion.Issuer;
      }
    }

    return '';
  }

  /**
   * Extract all SAML attributes from the assertion's AttributeStatement.
   * Handles various SAML implementations:
   * - Standard saml:Attribute / saml:AttributeValue
   * - IDP-ssigned NameID
   * - Flat attribute objects vs array of attributes
   *
   * Returns a flat Record<string, string> with all discovered attributes.
   */
  static extractAttributes(samlXml: string): Record<string, string> {
    const parsed = this.parse(samlXml);
    const attributes: Record<string, string> = {};

    // Navigate to find AttributeStatement
    const response = parsed['Response'] as Record<string, unknown> | undefined;
    const assertion = (response?.Assertion || parsed['Assertion']) as Record<string, unknown> | undefined;

    if (!assertion) return attributes;

    // Extract NameID from Subject
    try {
      const subject = assertion.Subject as Record<string, unknown> | undefined;
      const nameId = (subject?.NameID as Record<string, unknown> | undefined)?.['#text']
        ?? (subject?.NameID as string | undefined);
      if (nameId) {
        attributes.nameId = String(nameId);
      }
    } catch {
      // NameID may be absent
    }

    // Extract AttributeStatement attributes
    try {
      const attrStatement = assertion.AttributeStatement as Record<string, unknown> | undefined;
      if (!attrStatement) return attributes;

      let attrList = attrStatement.Attribute;

      // Normalize to array
      if (!Array.isArray(attrList)) {
        attrList = attrList ? [attrList] : [];
      }

      for (const attr of attrList as Array<Record<string, unknown>>) {
        const name = (attr['@_Name'] || attr['@_name'] || '') as string;
        if (!name) continue;

        // Extract AttributeValue(s)
        let values = attr.AttributeValue;

        // Normalize to array
        if (!Array.isArray(values)) {
          values = values ? [values] : [];
        }

        // Get the first text value
        const firstValue = (values as Array<unknown>)[0];
        let value = '';

        if (firstValue && typeof firstValue === 'object') {
          // e.g., { '#text': 'user@example.com' }
          value = String((firstValue as Record<string, unknown>)['#text'] ?? '');
        } else if (firstValue !== undefined && firstValue !== null) {
          value = String(firstValue);
        }

        if (value) {
          attributes[name] = value;
        }
      }
    } catch {
      // AttributeStatement may be absent or malformed
    }

    // Normalize common SAML attributes for convenience
    this.normalizeCommonAttributes(attributes);

    return attributes;
  }

  /**
   * Normalize common SAML attribute names to canonical keys.
   */
  private static normalizeCommonAttributes(attrs: Record<string, string>): void {
    const lowerToCanonical: Record<string, string> = {
      email: 'email',
      mail: 'email',
      'urn:oid:0.9.2342.19200300.100.1.3': 'email',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': 'email',
      givenname: 'givenName',
      firstname: 'givenName',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname': 'givenName',
      surname: 'surname',
      lastname: 'surname',
      family_name: 'surname',
      sn: 'surname',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname': 'surname',
      name: 'name',
      displayname: 'name',
      'urn:oid:2.5.4.42': 'givenName',      // givenName OID
      'urn:oid:2.5.4.4': 'surname',          // sn OID
      'urn:oid:0.9.2342.19200300.100.1.1': 'nameId', // uid OID
    };

    // Copy canonical mappings
    for (const [key, value] of Object.entries(attrs)) {
      const lower = key.toLowerCase().trim();
      const canonical = lowerToCanonical[lower];
      if (canonical && !attrs[canonical]) {
        attrs[canonical] = value;
      }
    }

    // Fallback: if we have NameID (contains @) but no email, use NameID
    if (!attrs.email && attrs.nameId?.includes('@')) {
      attrs.email = attrs.nameId;
    }

    // Fallback: derive name from email if missing
    if (!attrs.givenName && !attrs.name && attrs.email) {
      attrs.givenName = attrs.email.split('@')[0];
    }
  }

  /**
   * Resolve a mapped attribute path against the extracted attributes.
   * Supports dot-notation for nested access.
   */
  static resolveAttribute(attributes: Record<string, string>, mapping: string): string {
    const parts = mapping.split('.');
    let current: Record<string, unknown> | string = attributes;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part] as string;
      } else {
        return '';
      }
    }
    return String(current ?? '');
  }

  /**
   * Full pipeline: parse SAML → extract attributes → map using provider's mapping.
   * Returns the federated user fields ready for DB creation.
   */
  static mapSAMLUser(
    samlXml: string,
    mapping: {
      sub: string;
      email: string;
      name: string;
      surname?: string;
      role?: string;
    }
  ): { sub: string; email: string; name: string; surname: string; role: string } {
    const attributes = this.extractAttributes(samlXml);

    return {
      sub: this.resolveAttribute(attributes, mapping.sub),
      email: this.resolveAttribute(attributes, mapping.email),
      name: this.resolveAttribute(attributes, mapping.name),
      surname: mapping.surname ? this.resolveAttribute(attributes, mapping.surname) : '',
      role: mapping.role ? this.resolveAttribute(attributes, mapping.role) : 'USER',
    };
  }
}
