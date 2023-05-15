import APIDate from "./APIDateInterface"

export interface Side {
    civ: Array<string>,
    medic: Array<string>,
    cop: Array<string>,
    rac: Array<string>
}

export default interface Server {
    id: number,
    mod_id: number,
    appid: number,
    online: number,
    name: string,
    desc: string,
    ip: string,
    port: number,
    password: string,
    gamemode: number,
    params: string,
    slots: number,
    update_mods: number,
    players: Array<string>,
    sides: Side,
    updated_at: APIDate
}