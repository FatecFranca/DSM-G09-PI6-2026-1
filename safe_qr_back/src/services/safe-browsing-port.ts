export const SafeBrowsingThreatType = {
  malware: 'MALWARE',
  socialEngineering: 'SOCIAL_ENGINEERING',
  unwantedSoftware: 'UNWANTED_SOFTWARE',
  potentiallyHarmfulApplication: 'POTENTIALLY_HARMFUL_APPLICATION',
} as const;

export type SafeBrowsingThreatTypeName =
  (typeof SafeBrowsingThreatType)[keyof typeof SafeBrowsingThreatType];

export type SafeBrowsingMatch = {
  threatType: SafeBrowsingThreatTypeName;
};

/** Consulta reputação de URL (ex.: Google Safe Browsing). */
export interface SafeBrowsingPort {
  checkUrl(url: string): Promise<SafeBrowsingMatch | null>;
}

/** Desativado ou sem API key: nunca marca ameaça. */
export class NullSafeBrowsingPort implements SafeBrowsingPort {
  async checkUrl(): Promise<null> {
    return null;
  }
}

export function safeBrowsingThreatLabel(type: SafeBrowsingThreatTypeName): string {
  switch (type) {
    case SafeBrowsingThreatType.malware:
      return 'malware';
    case SafeBrowsingThreatType.socialEngineering:
      return 'phishing / engenharia social';
    case SafeBrowsingThreatType.unwantedSoftware:
      return 'software indesejado';
    case SafeBrowsingThreatType.potentiallyHarmfulApplication:
      return 'aplicativo potencialmente prejudicial';
    default:
      return 'ameaça conhecida';
  }
}
