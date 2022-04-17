import axios from "axios";
import { Credential } from "../interfaces/credentials.js";
import { __materials_api__ } from "../utils/constants.js";

export const testAuth = async (credentials: Credential): Promise<string | undefined> => {
  const auth: Credential = {
    username: credentials.username,
    password: credentials.password
  }
  try {
    const materials_token = await axios.post(__materials_api__, auth);
    const access_token: string = materials_token.data.access_token;
    return !!access_token ? access_token : undefined;
  }
  catch (err) {
    return undefined;
  }
}
