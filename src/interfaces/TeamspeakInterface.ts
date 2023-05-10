export default interface Teamspeak {
    Id: number,
    Usercount: number,
    Icon: string,
    Name: string,
    Ip: string,
    Slots: number,
    Port: number,
    OS: string,
    Banner: string,
    Users:  Array<string>
}