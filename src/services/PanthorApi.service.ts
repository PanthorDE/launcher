import type AuthTokenValidation from '@/interfaces/AuthToken.type';
import type Changelog from '@/interfaces/ChangelogInterface';
import type ModFile from '@/interfaces/ModFileInterface';
import type Mod from '@/interfaces/ModInterface';
import type Server from '@/interfaces/ServerInterface';
import type Teamspeak from '@/interfaces/TeamspeakInterface';
import type { Player } from '@/interfaces/UserInterface';
import convert from 'xml-js';
import axios from 'axios';
import News from '@/interfaces/NewsInterface';

export class PanthorApiService {
  private static host = 'https://api.panthor.de';

  static validateAuthToken(authToken: string): Promise<AuthTokenValidation> {
    return new Promise((res, rej) => {
      axios
        .get(this.host + '/v1/player/validate/' + authToken)
        .then((response) => res(response.data))
        .catch(rej);
    });
  }

  static getNews(): Promise<News[]> {
    return new Promise((res, rej) => {
      axios
        .get('https://panthor.de/feed/')
        .then((response) => {
          let jsonNews = JSON.parse(convert.xml2json(response.data, { compact: true, spaces: 4 }));
          res(jsonNews.rss.channel.item);
        }).catch(function (error) {
          console.log(error);
        })
        .catch(rej);
    });
  }

  static getProfile(authToken: string): Promise<Player> {
    return new Promise((res, rej) => {
      axios
        .get(this.host + '/v2/player/' + authToken)
        .then((response) => res(response.data.data[0]))
        .catch(rej);
    });
  }

  static getTeamspeaks(): Promise<Teamspeak[]> {
    return new Promise((res, rej) => {
      axios
        .get(this.host + '/v2/teamspeaks')
        .then((response) => res(response.data.data))
        .catch(rej);
    });
  }

  static getChangelogs(): Promise<Changelog[]> {
    return new Promise((res, rej) => {
      axios
        .get(this.host + '/v2/changelogs')
        .then((response) => res(response.data.data))
        .catch(rej);
    });
  }

  static getServers(): Promise<Server[]> {
    return new Promise((res, rej) => {
      axios
        .get(this.host + '/v2/servers')
        .then((response) => res(response.data.data))
        .catch(rej);
    });
  }

  static getMods(authToken?: string): Promise<Mod[]> {
    return new Promise((res, rej) => {
      axios
        .get(this.host + (authToken ? '/v2/mods/' + authToken : '/v2/mods/'))
        .then((response) => res(response.data.data))
        .catch(rej);
    });
  }

  static getMod(modId: number): Promise<Mod> {
    return new Promise((res, rej) => {
      axios
        .get(this.host + '/v2/mod/' + modId)
        .then((response) => res(response.data.data[0]))
        .catch(rej);
    });
  }

  static getModHashlist(modId: number): Promise<ModFile[]> {
    return new Promise((res, rej) => {
      axios
        .get(this.host + '/v2/mod/hashlist/' + modId)
        .then((response) => res(response.data.data))
        .catch(rej);
    });
  }
}
