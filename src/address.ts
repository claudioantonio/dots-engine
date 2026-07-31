import { PlayerId } from "./types";

/**
 * Canonicalize an EOA address for use as a player identifier.
 *
 * Cartesi supplies `msg_sender` already lowercase, but wallets supply
 * EIP-55 checksum-cased addresses. Without normalizing, the same player
 * submitted under different casing would fork replays and score buckets
 * between consumers. This is the only place in the engine allowed to know
 * player identifiers are case-insensitive hex strings.
 */
export function normalizePlayerId(id: string): PlayerId {
    return id.toLowerCase();
}
