import axios, { AxiosRequestConfig } from "axios";
import fs from "fs";
import path from "path";
import { Token } from "../interfaces/credentials.js";
import { Resource } from "../interfaces/resource.js";
import { currentYearShift, __scientia_base_path__ } from "../utils/constants.js";

export default class ScientiaAPI {

  baseUrl = __scientia_base_path__;
  token: Token;

  constructor(token: Token) {
    this.token = token;
  }

  public getCourses = async (path: string = "courses/") => {
    return (await axios.request(this.buildAxiosConfig(path + currentYearShift()))).data;
  }

  public getCourseResources = async (courseCode: string) => {
    return axios.request(this.buildAxiosConfig(`/resources?year=${currentYearShift()}&course=${courseCode}`))
  }

  public downloadFile = async (resource: Resource, _index: number, folderPath: string, courseName: string) => {
    const fullFolderPath = path.join(folderPath, courseName, resource.category);
    const filePath = path.join(folderPath, courseName, resource.category, resource.title)
    fs.mkdirSync(fullFolderPath, {recursive: true});
    const encodedCategory = encodeURIComponent(resource.category)
    return axios.get(this.baseUrl + "/resources/" + resource.id + "/file", {
        responseType: "stream",
        headers: {
            "Authorization": `Bearer ${this.token}`
        }
    }).then((response) => {
        const stream = response.data.pipe(fs.createWriteStream(filePath));
        return new Promise((resolve, _) => {
            stream.on("finish", () => {
                return resolve(true)
            })
        })

    })
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
