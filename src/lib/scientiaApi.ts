import axios, { AxiosRequestConfig } from "axios";
import { Token } from "../interfaces/credentials.js";
import { currentYearShift, __scientia_base_path__ } from "../utils/constants.js";

export default class ScientiaAPI {

  baseUrl = __scientia_base_path__;
  token: Token;

  constructor(token: Token) {
    this.token = token;
  }

  public getCourses = async (path: string) => {
    return (await axios.request(this.buildAxiosConfig(path + currentYearShift()))).data;
  }

  public getCourseResources = async (courseCode: string) => {
    return axios.request(this.buildAxiosConfig(`/resources?year=${currentYearShift()}&course=${courseCode}`))
  }

  private buildAxiosConfig = (path: string): AxiosRequestConfig => {
    return {
      url: this.baseUrl + path,
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    }
  }
}
