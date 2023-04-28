export interface Side {
    Civs: Array<string>,
    Medics: Array<string>,
    Cops: Array<string>,
    RAC: Array<string>
}

export default interface Server {
    Id: number,
    ModId: number,
    appId: number,
    online: number,
    Servername: string,
    Description: string,
    IpAddress: string,
    Port: number,
    ServerPassword: string,
    Gamemode: number,
    StartParameters: string,
    Slots: number,
    Update_Mods: number,
    Playercount: number,
    Civilians: number,
    Medics: number,
    Cops: number,
    Adac: number,
    Players:  Array<Side>,
    Side: Array<Side>,
    updated_at: Date
}