const CRYPTO_KEY = 'a4affcad11ea4c7f696e63edaf92095e';
const IV = new Uint8Array([38,100,240,76,189,111,227,246,178,254,115,201,91,244,245,171]);

export async function encryptString(text) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(CRYPTO_KEY),
    'AES-CBC',
    false,
    ['encrypt']
  );
  
  const encodedText = new TextEncoder().encode(text);
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv: IV },
    key,
    encodedText
  );
  
  return btoa(Array.from(new Uint8Array(encryptedData), byte => String.fromCharCode(byte)).join(''));
}

export async function decryptString(encryptedText) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(CRYPTO_KEY),
    'AES-CBC',
    false,
    ['decrypt']
  );
  
  const encryptedBytes = Uint8Array.from(atob(encryptedText), char => char.charCodeAt(0));
  const decryptedData = await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv: IV },
    key,
    encryptedBytes
  );
  
  return new TextDecoder().decode(decryptedData);
}

export async function genIntegrity(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
} 