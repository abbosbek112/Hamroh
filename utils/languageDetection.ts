/**
 * Language Detection Utility
 * Detects the language of user input text
 */

export type DetectedLanguage = 'uz' | 'ru' | 'en';

/**
 * Detect language from text using simple heuristics
 * Returns 'uz' as default if uncertain
 */
export const detectLanguage = (text: string): DetectedLanguage => {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return 'uz'; // Default to Uzbek
  }

  // Russian detection patterns
  const russianPatterns = [
    /[а-яё]/i, // Cyrillic letters
    /\b(привет|как|что|где|когда|почему|да|нет|спасибо|пожалуйста|извините)\b/i,
    /\b(это|этот|эта|эти|такой|такая|такое)\b/i,
    /\b(я|ты|он|она|мы|вы|они)\b/i,
  ];
  
  // English detection patterns
  const englishPatterns = [
    /\b(hello|hi|hey|what|where|when|why|how|yes|no|thank|please|sorry)\b/i,
    /\b(the|a|an|is|are|was|were|be|been|have|has|had|do|does|did)\b/i,
    /\b(you|your|yours|we|our|they|their|this|that|these|those)\b/i,
    /\b(can|could|should|would|will|shall|may|might|must)\b/i,
  ];
  
  // Uzbek detection patterns
  const uzbekPatterns = [
    /[ўқғҳ]/i, // Uzbek-specific letters
    /\b(salom|qanday|nima|qayerda|qachon|nega|ha|yo'q|rahmat|iltimos|kechirasiz)\b/i,
    /\b(bu|shu|u|men|sen|biz|siz|ular)\b/i,
    /\b(va|yoki|lekin|chunki|agar|demak|shuning|uchun)\b/i,
  ];
  
  // Count matches for each language
  let russianScore = 0;
  let englishScore = 0;
  let uzbekScore = 0;
  
  // Check for Cyrillic characters (strong indicator of Russian)
  if (/[а-яё]/i.test(text)) {
    russianScore += 10;
  }
  
  // Check for Uzbek-specific characters
  if (/[ўқғҳ]/i.test(text)) {
    uzbekScore += 10;
  }
  
  // Check patterns
  russianPatterns.forEach(pattern => {
    if (pattern.test(text)) russianScore += 2;
  });
  
  englishPatterns.forEach(pattern => {
    if (pattern.test(text)) englishScore += 2;
  });
  
  uzbekPatterns.forEach(pattern => {
    if (pattern.test(text)) uzbekScore += 2;
  });
  
  // Check character distribution
  const cyrillicCount = (text.match(/[а-яё]/gi) || []).length;
  const latinCount = (text.match(/[a-z]/gi) || []).length;
  const uzbekSpecificCount = (text.match(/[ўқғҳ]/gi) || []).length;
  
  if (cyrillicCount > latinCount && cyrillicCount > 0) {
    russianScore += 5;
  }
  
  if (uzbekSpecificCount > 0) {
    uzbekScore += 5;
  }
  
  // Determine language based on scores
  if (russianScore > englishScore && russianScore > uzbekScore && russianScore >= 3) {
    return 'ru';
  }
  
  if (englishScore > russianScore && englishScore > uzbekScore && englishScore >= 3) {
    return 'en';
  }
  
  // Default to Uzbek if uncertain or if Uzbek has highest score
  return 'uz';
};

/**
 * Get language name in that language
 */
export const getLanguageName = (lang: DetectedLanguage): string => {
  switch (lang) {
    case 'uz':
      return 'o\'zbek';
    case 'ru':
      return 'русский';
    case 'en':
      return 'English';
    default:
      return 'o\'zbek';
  }
};

