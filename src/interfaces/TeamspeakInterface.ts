export default interface Teamspeak {
    id: number,
    players: number,
    icon: string,
    name: string,
    ip: string,
    slots: number,
    port: number,
    platform: string,
    banner: string,
    users:  Array<string>
}