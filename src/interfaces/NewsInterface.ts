export default interface News {
  title:             Text;
  link:              Text;
  "dc:creator":      cData;
  pubDate:           Text;
  description:       cData;
}

export interface cData {
  _cdata: string;
}

export interface Text {
  _text: string;
}