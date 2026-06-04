export class GameConstants {
    static readonly GRID_SIZE = 6;
    static readonly MAX_PLAYERS = 2;

    static readonly PLAYER1: number = 0;
    static readonly PLAYER2: number = 1;

    static readonly BOTPLAYER_ID: number = 0;

    // Game possible statuses
    static readonly STATUS_NOT_INITIATED: number = 1;
    static readonly STATUS_IN_PROGRESS: number = 2;
    static readonly STATUS_OVER: number = 3;
    static readonly STATUS_OVER_BY_DRAW: number = 4;
};