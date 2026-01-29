// Client-side auth utilities using Web Crypto PBKDF2
// Note: This improves over btoa but is not a substitute for server-side auth.
const bufToHex = (buf) => {
    return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
};

const hexToBuf = (hex) => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes.buffer;
};

const genSalt = (len = 16) => {
    const arr = new Uint8Array(len);
    crypto.getRandomValues(arr);
    return arr.buffer;
};

const derivePBKDF2 = async (
    password,
    saltBuf,
    iterations = 100000,
    hash = 'SHA-256',
    keyLen = 32
) => {
    const enc = new TextEncoder();
    const passKey = await crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );
    const derived = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: saltBuf,
            iterations,
            hash,
        },
        passKey,
        keyLen * 8
    );
    return derived; // ArrayBuffer
};

const equalBuffers = (bufA, bufB) => {
    const a = new Uint8Array(bufA);
    const b = new Uint8Array(bufB);
    if (a.length !== b.length) return false;
    let res = 0;
    for (let i = 0; i < a.length; i++) res |= a[i] ^ b[i];
    return res === 0;
};

// Persist user: store {id, email, phone, salt, hash, createdAt, migrated}
export const signupClient = async (id, password, email = '', phone = '') => {
    const salt = genSalt(16);
    const derived = await derivePBKDF2(password, salt, 100000);
    const saltHex = bufToHex(salt);
    const hashHex = bufToHex(derived);
    const usersJson = localStorage.getItem('logbook_users');
    const users = usersJson ? JSON.parse(usersJson) : [];
    // avoid duplicate id
    if (users.find((u) => u.id === id)) {
        throw new Error('ID already exists');
    }
    users.push({
        id,
        email,
        phone,
        salt: saltHex,
        hash: hashHex,
        createdAt: new Date().toISOString(),
        migrated: false,
    });
    localStorage.setItem('logbook_users', JSON.stringify(users));
    return true;
};

export const loginClient = async (id, password) => {
    const usersJson = localStorage.getItem('logbook_users');
    const users = usersJson ? JSON.parse(usersJson) : [];
    const user = users.find((u) => u.id === id);
    if (!user) return false;
    try {
        const saltBuf = hexToBuf(user.salt);
        const derived = await derivePBKDF2(password, saltBuf, 100000);
        const ok = equalBuffers(derived, hexToBuf(user.hash));
        return ok;
    } catch (err) {
        // fallback: if salt/hash missing (old btoa), compare with atob/btoa
        try {
            const decoded = atob(user.password);
            if (decoded === password) return true;
        } catch (e) {
            // ignore
        }
        const encoded = btoa(password);
        return user.password === encoded || user.password === password;
    }
};

export default { signupClient, loginClient };
