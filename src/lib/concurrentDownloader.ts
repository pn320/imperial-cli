import chalk from "chalk";
import fs from "fs";
import Listr, { ListrTask } from "listr";
import open from "open";
import path from "path";
import { Resource, ResourceWithLink } from "../interfaces/resource.js";
import { success } from "../utils/constants.js";
import { downloadURL } from "./link-download.js";
import { promptOpenFolder } from "./prompts.js";
import ScientiaAPI from "./scientiaApi.js";

class ConcurrentDownloader {

  scientiaAPI: ScientiaAPI;
  course: string;
  folderPath: string;
  tasks: ListrTask[] = [];


  constructor(scientiaLegacy: ScientiaAPI, course: string, folderPath: string) {
    this.scientiaAPI = scientiaLegacy;
    this.course = course;
    this.folderPath = folderPath;
  }

  scheduleDownloads(resources: Resource[]) {
    for (let i = 0; i < resources.length; i++) {
      let currentResource = resources[i];
      const filePath = path.join(this.folderPath, this.course, currentResource.category, currentResource.title)
      if (!fs.existsSync(filePath)) {
        this.tasks.push({
          title: "Downloading " + currentResource.title,
          task: async () => {
            await this.scientiaAPI.downloadFile(currentResource, currentResource.index, this.folderPath, this.course)
          }
        })
      }

    }
  }

  scheduleLinkDownloads(resources: ResourceWithLink[]) {
    for (let i = 0; i < resources.length; i++) {
      let currentResource = resources[i];
      const filePath = path.join(this.folderPath, this.course, currentResource.category, currentResource.title + ".pdf")
      if (!fs.existsSync(filePath)) {
        this.tasks.push({
          title: "Downloading " + currentResource.title,
          task: async () => {
            await downloadURL(this.folderPath, this.course, currentResource)
          }
        })
      }
    }
  }

  async executeDownloads(openFolder: boolean) {
    const numToDownload = this.tasks.length;
    if (numToDownload !== 0) {
      const listr = new Listr(this.tasks, { concurrent: true })
      return await listr.run().catch((err: Error) => {
        console.error(err);
      }).then(async () => {
        console.log(success(`Downloaded ${numToDownload} new resources!`))
        if (openFolder) {
          const openFolderResponse = await promptOpenFolder()
          if (openFolderResponse.openFolder) {
            await open(path.join(this.folderPath, this.course))
          }
        }
      });
    } else {
      console.log(success("All resources already downloaded, no new to pull!"))
      if (openFolder) {
        const openFolderResponse = await promptOpenFolder()
        if (openFolderResponse.openFolder) {
          await open(path.join(this.folderPath, this.course))
        }
      }
    }
  }

}

export default ConcurrentDownloader;
