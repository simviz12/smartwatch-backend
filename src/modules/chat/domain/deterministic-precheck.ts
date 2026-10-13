import { CrisisResource, RiskLevel, SafetyCheckResult } from '../domain/chat.entity';

export const VERIFIED_CRISIS_RESOURCES: CrisisResource[] = [
  {
    name: 'Línea 106 - El poder de ser escuchado (Bogotá / Colombia)',
    phone: '106',
    description: 'Orientación psicológica gratuita disponible 24 horas al día, 7 días a la semana.',
    availableHours: '24/7',
    countryCode: 'CO',
  },
  {
    name: 'Línea de la Esperanza (Colombia)',
    phone: '192',
    description: 'Línea nacional de apoyo emocional y prevención del suicidio.',
    availableHours: '24/7',
    countryCode: 'CO',
  },
];

// Spanish Idiom Allowlist (colloquial benign expressions that contain words like "morir", "matar")
export const IDIOM_ALLOWLIST: string[] = [
  'me muero de hambre',
  'me muero de risa',
  'me muero de calor',
  'me muero de frío',
  'me muero de sueño',
  'me muero de vergüenza',
  'me mata la curiosidad',
  'estoy muerto de cansancio',
  'estoy que me muero del cansancio',
  'estoy muerto de la risa',
  'matar el tiempo',
];

// High risk suicide/self-harm triggers (exact or normalized stems)
export const HIGH_RISK_KEYWORDS: string[] = [
  'suicidarme',
  'suicidio',
  'quitarme la vida',
  'matarme',
  'no quiero vivir',
  'ya no quiero vivir',
  'quiero desaparecer',
  'acabar con mi vida',
  'cortarme las venas',
  'ahorcarme',
  'tirarme de un puente',
  'tomar pastillas para no despertar',
  'no vale la pena vivir',
  'no vale la pena seguir',
];

// Medium risk emotional distress triggers
export const MEDIUM_RISK_KEYWORDS: string[] = [
  'no puedo más',
  'estoy muy desesperado',
  'estoy muy desesperada',
  'siento un dolor insoportable',
  'no le importo a nadie',
  'siento que no sirvo para nada',
  'mucho vacío',
  'crisis de angustia',
  'me siento muy solo',
  'me siento muy sola',
];

export class DeterministicPreCheck {
  public static check(text: string): SafetyCheckResult {
    const normalized = text.toLowerCase().trim();

    // 1. Check Allowlist first
    for (const idiom of IDIOM_ALLOWLIST) {
      if (normalized.includes(idiom)) {
        return {
          riskLevel: RiskLevel.LOW,
          matchedIdiom: idiom,
          recommendedAction: 'PROCEED_LLM',
        };
      }
    }

    // 2. Check High Risk
    for (const kw of HIGH_RISK_KEYWORDS) {
      if (normalized.includes(kw)) {
        return {
          riskLevel: RiskLevel.HIGH,
          triggeredKeyword: kw,
          crisisResources: VERIFIED_CRISIS_RESOURCES,
          recommendedAction: 'STOP_AND_CRISIS',
        };
      }
    }

    // 3. Check Medium Risk
    for (const kw of MEDIUM_RISK_KEYWORDS) {
      if (normalized.includes(kw)) {
        return {
          riskLevel: RiskLevel.MEDIUM,
          triggeredKeyword: kw,
          crisisResources: VERIFIED_CRISIS_RESOURCES,
          recommendedAction: 'PROMPT_SUPPORT',
        };
      }
    }

    // Default Low Risk
    return {
      riskLevel: RiskLevel.LOW,
      recommendedAction: 'PROCEED_LLM',
    };
  }
}
