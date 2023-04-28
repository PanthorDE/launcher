export default interface Changelog {
    id: number,
    version: string,
    note: string,
    size: string,
    active: number,
    change_mission: Array<string>,
    change_map: Array<string>,
    change_mod: Array<string>,
    release_at: Date,
    created_at: Date,
    updated_at: Date
}