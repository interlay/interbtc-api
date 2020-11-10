/**
 * Converts endianness of a Uint8Array
 * @param bytes Uint8Array, to be converted LE<>BE
 */
export function reverseEndianness(bytes: Uint8Array): Uint8Array {
    let offset = bytes.length;
    for (let index = 0; index < bytes.length; index += bytes.length) {
        offset--;
        for (let x = 0; x < offset; x++) {
            const b = bytes[index + x];
            bytes[index + x] = bytes[index + offset];
            bytes[index + offset] = b;
            offset--;
        }
    }
    return bytes;
}

function isHexPrefixed(str: string): boolean {
    return str.slice(0, 2) === "0x";
}

/**
 * Remove the `0x` hex prefix if present
 * @param str
 */
export function stripHexPrefix(str: string): string {
    return isHexPrefixed(str) ? str.slice(2) : str;
}

/**
 * Reverse the endianness of the given hex string
 * @dev Will remove `0x` prefix if present
 * @param hex
 */
export function reverseEndiannessHex(hex: string) {
    const arr = stripHexPrefix(hex).match(/.{1,2}/g) || [];
    const bytes = new Uint8Array(arr.map((byte) => parseInt(byte, 16)));
    return reverseEndianness(bytes).reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");
}

/**
 * Converts a Uint8Array to string
 * @dev Will remove `0x` prefix if present
 * @param bytes
 */
export function uint8ArrayToString(bytes: Uint8Array): string {
    return stripHexPrefix(bytes.toString()).split("").join("");
}
