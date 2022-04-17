import keytar from 'keytar';
import { Credential } from '../interfaces/credentials';
import { category } from '../utils/constants.js';

export default class CredentialStore {
  deleteCredentials = async () => {
    const credentials = await keytar.findCredentials(category);
    await keytar.deletePassword(category, credentials[0].account);
  }

  setCredentials = async (credentials: Credential): Promise<void> => {
    await keytar.setPassword(category, credentials.username, credentials.password);
  }

  getCredentials = async (): Promise<Credential | undefined> => { 
    const credentials = await keytar.findCredentials(category);
    return credentials.length !== 0 ? this.createCredential(credentials[0]) : undefined;
  }

  createCredential = (credentials: { account: string; password: string; }): Credential => {
    return { username: credentials.account, password: credentials.password };
  }
}