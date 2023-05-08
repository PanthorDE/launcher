export interface Player {
    pid: string,
    guid: string,
    name: string,
    avatar: string,
    avatar_medium: string,
    avatar_full: string,
}

export default interface User {
    name: string,
    player: Player
}