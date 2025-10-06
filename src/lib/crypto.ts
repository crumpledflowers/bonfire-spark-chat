import sodium from 'libsodium-wrappers';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

// Initialize libsodium
export const initCrypto = async () => {
  await sodium.ready;
};

// Generate a new X25519 keypair
export const generateKeyPair = async (): Promise<KeyPair> => {
  await sodium.ready;
  const keyPair = sodium.crypto_box_keypair();
  
  return {
    publicKey: sodium.to_base64(keyPair.publicKey),
    privateKey: sodium.to_base64(keyPair.privateKey),
  };
};

// Encrypt private key with user's passphrase
export const encryptPrivateKey = async (privateKey: string, passphrase: string): Promise<string> => {
  await sodium.ready;
  
  const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
  const key = sodium.crypto_pwhash(
    sodium.crypto_secretbox_KEYBYTES,
    passphrase,
    salt,
    sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_ALG_DEFAULT
  );
  
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const privateKeyBytes = sodium.from_base64(privateKey);
  const ciphertext = sodium.crypto_secretbox_easy(privateKeyBytes, nonce, key);
  
  // Combine salt + nonce + ciphertext
  const combined = new Uint8Array(salt.length + nonce.length + ciphertext.length);
  combined.set(salt, 0);
  combined.set(nonce, salt.length);
  combined.set(ciphertext, salt.length + nonce.length);
  
  return sodium.to_base64(combined);
};

// Decrypt private key with user's passphrase
export const decryptPrivateKey = async (encryptedKey: string, passphrase: string): Promise<string> => {
  await sodium.ready;
  
  const combined = sodium.from_base64(encryptedKey);
  const salt = combined.slice(0, sodium.crypto_pwhash_SALTBYTES);
  const nonce = combined.slice(sodium.crypto_pwhash_SALTBYTES, sodium.crypto_pwhash_SALTBYTES + sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext = combined.slice(sodium.crypto_pwhash_SALTBYTES + sodium.crypto_secretbox_NONCEBYTES);
  
  const key = sodium.crypto_pwhash(
    sodium.crypto_secretbox_KEYBYTES,
    passphrase,
    salt,
    sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_ALG_DEFAULT
  );
  
  const decrypted = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);
  return sodium.to_base64(decrypted);
};

// Encrypt a message for a recipient
export const encryptMessage = async (
  message: string,
  recipientPublicKey: string,
  senderPrivateKey: string
): Promise<string> => {
  await sodium.ready;
  
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  const messageBytes = sodium.from_string(message);
  const recipientPubKeyBytes = sodium.from_base64(recipientPublicKey);
  const senderPrivKeyBytes = sodium.from_base64(senderPrivateKey);
  
  const ciphertext = sodium.crypto_box_easy(
    messageBytes,
    nonce,
    recipientPubKeyBytes,
    senderPrivKeyBytes
  );
  
  // Combine nonce + ciphertext
  const combined = new Uint8Array(nonce.length + ciphertext.length);
  combined.set(nonce, 0);
  combined.set(ciphertext, nonce.length);
  
  return sodium.to_base64(combined);
};

// Decrypt a message
export const decryptMessage = async (
  encryptedMessage: string,
  senderPublicKey: string,
  recipientPrivateKey: string
): Promise<string> => {
  await sodium.ready;
  
  const combined = sodium.from_base64(encryptedMessage);
  const nonce = combined.slice(0, sodium.crypto_box_NONCEBYTES);
  const ciphertext = combined.slice(sodium.crypto_box_NONCEBYTES);
  
  const senderPubKeyBytes = sodium.from_base64(senderPublicKey);
  const recipientPrivKeyBytes = sodium.from_base64(recipientPrivateKey);
  
  const decrypted = sodium.crypto_box_open_easy(
    ciphertext,
    nonce,
    senderPubKeyBytes,
    recipientPrivKeyBytes
  );
  
  return sodium.to_string(decrypted);
};

// Store encrypted private key in localStorage
export const storeEncryptedPrivateKey = (encryptedKey: string) => {
  localStorage.setItem('bonfire_encrypted_private_key', encryptedKey);
};

// Get encrypted private key from localStorage
export const getEncryptedPrivateKey = (): string | null => {
  return localStorage.getItem('bonfire_encrypted_private_key');
};

// Clear stored keys (on logout)
export const clearStoredKeys = () => {
  localStorage.removeItem('bonfire_encrypted_private_key');
};
