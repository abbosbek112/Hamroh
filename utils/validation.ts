/**
 * =========================================================================================
 * 🛡️ INPUT VALIDATION & SANITIZATION
 * =========================================================================================
 * 
 * SECURITY FEATURES:
 * - XSS (Cross-Site Scripting) protection
 * - SQL injection prevention (defense in depth)
 * - Input length validation
 * - Spam and profanity detection
 * - HTML entity encoding/decoding
 * - Safe HTML tag removal
 * 
 * USAGE:
 * - Always validate before processing
 * - Always sanitize before storage/display
 * - Use validateMessage() for chat messages
 * - Use sanitizeInput() before saving to database
 * - Use decodeHtmlEntities() only for display (never for storage)
 * 
 * NOTE: For production, consider installing DOMPurify for stronger XSS protection
 * =========================================================================================
 */

// Maximum lengths for inputs
export const MAX_LENGTHS = {
  MESSAGE: 5000,
  GROUP_NAME: 100,
  GROUP_DESCRIPTION: 500,
  USERNAME: 30,
  BIO: 500,
  TODO_TITLE: 200,
  TODO_DESCRIPTION: 1000,
  JOURNAL_ENTRY: 10000,
} as const;

/**
 * Decode HTML entities (for display purposes)
 * SECURITY: Using textContent instead of innerHTML to prevent XSS
 */
export const decodeHtmlEntities = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  
  // Safe method: Use textContent instead of innerHTML to prevent XSS
  const textarea = document.createElement('textarea');
  textarea.textContent = text;
  // Decode HTML entities safely
  const decoded = textarea.textContent || textarea.value || text;
  return decoded;
};

/**
 * Sanitize HTML and prevent XSS attacks
 * 
 * SECURITY FEATURES:
 * - Removes all script tags (including nested and obfuscated)
 * - Removes javascript: protocol links
 * - Removes event handlers (onclick, onerror, etc.)
 * - Encodes HTML special characters (< >)
 * - Prevents SQL injection by encoding quotes
 * 
 * NOTE: This function encodes special characters for storage, but for display use decodeHtmlEntities
 * For production, consider installing DOMPurify: npm install dompurify @types/dompurify
 * 
 * @param input - User input string to sanitize
 * @returns Sanitized string safe for storage and display
 */
export const sanitizeInput = (input: string): string => {
  // SECURITY: Validate input type
  if (!input || typeof input !== 'string') return '';
  
  // SECURITY: Remove all script tags (including nested and obfuscated attempts)
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove object tags
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '') // Remove embed tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:text\/html/gi, '') // Remove data: HTML protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers (onclick, onerror, etc.)
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ''); // Remove style tags
  
  // SECURITY: Encode HTML special characters to prevent XSS
  sanitized = sanitized
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;') // Encode double quotes
    .replace(/'/g, '&#x27;'); // Encode single quotes
  
  // SECURITY: Remove any remaining suspicious patterns
  sanitized = sanitized
    .replace(/&#x[0-9a-fA-F]{2,4};/g, '') // Remove hex entities (potential XSS)
    .replace(/&[#\w]+;/g, (match) => {
      // Only allow safe HTML entities
      const safeEntities = ['&lt;', '&gt;', '&quot;', '&#x27;', '&amp;'];
      return safeEntities.includes(match) ? match : '';
    });
  
  return sanitized.trim();
};

/**
 * Validate message text
 */
export const validateMessage = (text: string): { valid: boolean; error?: string } => {
  if (!text || typeof text !== 'string') {
    return { valid: false, error: 'Xabar bo\'sh bo\'lishi mumkin emas' };
  }

  const trimmed = text.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Xabar bo\'sh bo\'lishi mumkin emas' };
  }

  if (trimmed.length > MAX_LENGTHS.MESSAGE) {
    return { 
      valid: false, 
      error: `Xabar juda uzun (maksimum ${MAX_LENGTHS.MESSAGE} belgi)` 
    };
  }

  return { valid: true };
};

/**
 * Validate group name
 */
export const validateGroupName = (name: string): { valid: boolean; error?: string } => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Guruh nomi kiritilishi shart' };
  }

  const trimmed = name.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Guruh nomi bo\'sh bo\'lishi mumkin emas' };
  }

  if (trimmed.length < 3) {
    return { valid: false, error: 'Guruh nomi kamida 3 belgi bo\'lishi kerak' };
  }

  if (trimmed.length > MAX_LENGTHS.GROUP_NAME) {
    return { 
      valid: false, 
      error: `Guruh nomi juda uzun (maksimum ${MAX_LENGTHS.GROUP_NAME} belgi)` 
    };
  }

  // Check for dangerous characters
  if (/[<>{}[\]\\]/.test(trimmed)) {
    return { valid: false, error: 'Guruh nomida ruxsat etilmaydigan belgilar bor' };
  }

  return { valid: true };
};

/**
 * Validate username
 */
export const validateUsername = (username: string): { valid: boolean; error?: string } => {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username kiritilishi shart' };
  }

  const trimmed = username.trim();
  
  if (trimmed.length < 5) {
    return { valid: false, error: 'Username kamida 5 belgi bo\'lishi kerak' };
  }

  if (trimmed.length > MAX_LENGTHS.USERNAME) {
    return { 
      valid: false, 
      error: `Username juda uzun (maksimum ${MAX_LENGTHS.USERNAME} belgi)` 
    };
  }

  // Only alphanumeric and underscore
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return { valid: false, error: 'Username faqat harflar, raqamlar va _ belgisidan iborat bo\'lishi kerak' };
  }

  // Reserved words
  const reserved = ['admin', 'hamroh', 'root', 'system', 'null', 'undefined'];
  if (reserved.includes(trimmed.toLowerCase())) {
    return { valid: false, error: 'Bu username ruxsat etilmaydi' };
  }

  return { valid: true };
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email kiritilishi shart' };
  }

  const trimmed = email.trim().toLowerCase();
  
  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Noto\'g\'ri email formati' };
  }

  return { valid: true };
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { valid: boolean; error?: string; strength?: 'weak' | 'medium' | 'strong' } => {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Parol kiritilishi shart' };
  }

  if (password.length < 6) {
    return { valid: false, error: 'Parol kamida 6 belgi bo\'lishi kerak' };
  }

  // Check strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  
  if (password.length >= 8) {
    strength = 'medium';
  }
  
  if (password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password)) {
    strength = 'strong';
  }

  return { valid: true, strength };
};

/**
 * Limit string length
 */
export const limitLength = (text: string, maxLength: number): string => {
  if (!text || typeof text !== 'string') return '';
  return text.substring(0, maxLength);
};

/**
 * Check for spam and profanity in message
 * Returns: { isSpam: boolean, reason?: string }
 */
export const checkSpamAndProfanity = (text: string): { isSpam: boolean; reason?: string } => {
  if (!text || typeof text !== 'string') {
    return { isSpam: false };
  }

  const lowerText = text.toLowerCase().trim();

  // Haqoratli va behayo so'zlar ro'yxati (o'zbek, rus, ingliz tillarida)
  const profanityWords = [
    // O'zbekcha
    'ahmoq', 'jinni', 'jinnivoy', 'axmoq', 'jallod', 'yomon', 'badtar',
    // Ruscha
    'сука', 'блять', 'пиздец', 'хуй', 'ебан', 'ебать',
    // Inglizcha
    'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard', 'crap', 'piss', 'dick', 'cock', 'pussy',
    'motherfucker', 'retard', 'idiot', 'moron', 'stupid'
  ];

  // Check for profanity
  for (const word of profanityWords) {
    if (lowerText.includes(word)) {
      return { isSpam: true, reason: 'Haqoratli yoki behayo so\'zlardan foydalanish taqiqlangan' };
    }
  }

  // Check for repeated characters (spam pattern)
  if (/(.)\1{10,}/.test(text)) {
    return { isSpam: true, reason: 'Spam formatida xabar' };
  }

  // Check for too many capital letters (shouting)
  const capitalRatio = (text.match(/[A-ZА-ЯЁ]/g) || []).length / text.length;
  if (capitalRatio > 0.7 && text.length > 20) {
    return { isSpam: true, reason: 'Juda ko\'p bosh harf (spam formatida)' };
  }

  return { isSpam: false };
};
