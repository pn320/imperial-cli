export interface Credential {
  username: string;
  password: string;
}

export interface ResponseCredential extends Credential {
  id: any;
  type: any;
}

export interface TokenAndCredential {
  credentials: Credential;
  token: Token;
}

export type Token = string;