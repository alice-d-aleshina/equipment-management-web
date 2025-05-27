/**
 * Card Encryption/Decryption Utilities
 * Compatible with Arduino Card Reader AES-256-CBC encryption
 */

import { ARDUINO_CONFIG } from '@/lib/config/arduino-config';

/**
 * Создание ключа шифрования с помощью упрощенного алгоритма
 * (в браузере нет доступа к scrypt, используем упрощенную версию)
 * @param {string} password - Секретный ключ
 * @returns {Promise<CryptoKey>} - Ключ для шифрования
 */
async function deriveKey(password) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('card-reader-salt'), // Фиксированная соль для совместимости
      iterations: 1000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-CBC', length: 256 },
    false,
    ['decrypt']
  );
}

/**
 * Расшифровка номера карты
 * @param {string} encryptedCardId - Зашифрованная строка в формате: iv:encryptedData (base64)
 * @returns {Promise<string>} - Расшифрованный номер карты
 */
export async function decryptCardId(encryptedCardId) {
  try {
    if (!encryptedCardId || typeof encryptedCardId !== 'string') {
      console.warn('Invalid encrypted card ID:', encryptedCardId);
      return encryptedCardId;
    }

    // Проверяем, содержит ли строка разделитель ':'
    if (!encryptedCardId.includes(':')) {
      // Вероятно, это уже расшифрованная карта
      console.log('Card ID appears to be unencrypted:', encryptedCardId);
      return encryptedCardId;
    }

    const [ivBase64, encryptedDataBase64] = encryptedCardId.split(':');
    
    if (!ivBase64 || !encryptedDataBase64) {
      console.error('Invalid encrypted format:', encryptedCardId);
      return encryptedCardId;
    }

    // Декодируем base64
    const iv = new Uint8Array(atob(ivBase64).split('').map(c => c.charCodeAt(0)));
    const encryptedData = new Uint8Array(atob(encryptedDataBase64).split('').map(c => c.charCodeAt(0)));

    // Создаем ключ
    const key = await deriveKey(ARDUINO_CONFIG.ENCRYPTION_KEY);

    // Расшифровываем
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-CBC',
        iv: iv
      },
      key,
      encryptedData
    );

    // Декодируем результат
    const decoder = new TextDecoder();
    const decryptedCardId = decoder.decode(decrypted);
    
    console.log('Card ID decrypted successfully:', decryptedCardId);
    return decryptedCardId;
  } catch (error) {
    console.error('Error decrypting card ID:', error);
    console.error('Encrypted input:', encryptedCardId);
    // В случае ошибки возвращаем исходную строку
    return encryptedCardId;
  }
}

/**
 * Проверка, является ли строка зашифрованной
 * @param {string} cardId - ID карты для проверки
 * @returns {boolean} - true если строка зашифрована
 */
export function isEncryptedCardId(cardId) {
  if (!cardId || typeof cardId !== 'string') {
    return false;
  }
  
  // Зашифрованная строка должна содержать ':' и быть в формате base64:base64
  const parts = cardId.split(':');
  if (parts.length !== 2) {
    return false;
  }
  
  // Проверяем, что обе части похожи на base64
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(parts[0]) && base64Regex.test(parts[1]) && parts[0].length > 0 && parts[1].length > 0;
}

/**
 * Безопасная дешифровка - не выдает ошибок
 * @param {string} cardId - Возможно зашифрованный ID карты
 * @returns {Promise<string>} - Гарантированно валидный ID карты
 */
export async function safeDecryptCardId(cardId) {
  try {
    if (isEncryptedCardId(cardId)) {
      return await decryptCardId(cardId);
    }
    return cardId;
  } catch (error) {
    console.error('Safe decrypt failed:', error);
    return cardId;
  }
} 