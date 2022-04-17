#!/usr/bin/env node

import { ArgumentParser } from "argparse";
import chalk from "chalk";
import ora from "ora";
import path from "path";
import { Course } from "./interfaces/course.js";
import { TokenAndCredential } from "./interfaces/credentials.js";
import { Resource, ResourceWithLink } from "./interfaces/resource.js";
import ConcurrentDownloader from "./lib/concurrentDownloader.js";
import ConfigStore from "./lib/configstore.js";
import CredentialStore from "./lib/credentialStore.js";
import { testAuth } from "./lib/download.js";
import { getCredentials, pickCourse, setFolder } from "./lib/prompts.js";
import ScientiaAPI from "./lib/scientiaApi.js";
import { category, check, success, warning } from "./utils/constants.js";
import { delay } from "./utils/delay.js";
import { loadInterface } from "./utils/startup.js";

const version = "1.0.0";
const parse = new ArgumentParser({
  description: 'Materials for the Imperial Scientia website'
});

parse.add_argument('shortcut', {nargs: "?", help: "Shortcut to course"})
parse.add_argument('-v', '--version', {action: 'version', version});
parse.add_argument('-c', '--clean', {action: 'store_true', help: "clean configuration and shortcuts"});
parse.add_argument('-o', '--open', {action: 'store_true', help: "open folder based off shortcut or selection"});
parse.add_argument('-d', '--dir', {action: 'store_true', help: "save folders in current directory instead"});
parse.add_argument('-a', '--all', {action: 'store_true', help: "download resources for all courses with saved shortcuts together"});
const args = parse.parse_args();

const credentialStore = new CredentialStore();
const conf = new ConfigStore(category);
let credentialsAndTokenStore: TokenAndCredential;

const main = async () => {
  /**
   * Introduction to the CLI
   */
  await loadInterface();
  await delay(500);
  console.log(chalk.hex('#3296c8')(`Scientia CLI v${"1.0.0"}`));

  if (args.clean) {
    const spinner = ora('clearing configuration from keychain').start();
    await delay(500);
    spinner.stop();
    await credentialStore.deleteCredentials()
    conf.clearConfig();
    console.log(success(`${check} Configuration cleared!`));
    return;
  }

  /**
   * Retrieving the credentials from correct password manager as per the OS. 
   * Boo Windows:_
   */
  const spinner = ora('retrieving credentials from keychain').start();
  await delay(1000);
  let existingCredentials = await credentialStore.getCredentials();
  spinner.stop();

  /**
   * Figure out a cleaner way to do this, also set a maximum depth or in the case of error connecting to the api, maximum depth of 3 failed attempts.
   */
  if (!existingCredentials) {
    console.log(warning('prior credentials not found in keychain.'));
    const tokenAndCredentials = await getCredentials();
    await credentialStore.setCredentials(tokenAndCredentials.credentials);
    credentialsAndTokenStore = tokenAndCredentials;
  }
  else {
    /**
     * feels like there's a lot of code duplication, maybe look at some way to reduce it?
     * also a really cool thing to implement would be code duplication, better versions would perform semantic analysis on the code and point out not so obvious duplicates.
     */
    console.log(success(`${check} Succesefully retrieved credentials from keychain!`));
    const spinner = ora('signing into scientia').start();
    await delay(1000);
    spinner.stop();
    const _token = await testAuth(existingCredentials);
    if (!_token) {
      const newTokenAndCredentials = await getCredentials();
      await credentialStore.setCredentials(newTokenAndCredentials.credentials);
      credentialsAndTokenStore = newTokenAndCredentials;
    }
    else {
      console.log(success(`${check} successefully authenticated and signed in!`));
      credentialsAndTokenStore = { credentials: existingCredentials, token: _token };
    }
  }

  /**
   * insert witty comment for this section that I'm too tired to think of. 
   */
  const scientiaAPI = new ScientiaAPI(credentialsAndTokenStore.token);
  const confSpinner = ora('retrieving default location for storing resources').start();
  await delay(1000);
  confSpinner.stop();
  if (!conf.getFolderPath()) {
    console.log(warning('Could not retrieve default location for storing resources'));
    const folderPath = await setFolder();
    conf.setFolderPath(folderPath);
    console.log(success(`${check} Sucessefully stored default location for placing new resources!`));
  } else {
    console.log(success(`${check} Retrieved default location for storing resources!`));
  }

  const currentShortcuts = conf.getShortcuts();
  let course: Course = {} as Course;
  const shortCutArg: string = args.shortcut;
  if (shortCutArg) {
    course = currentShortcuts[shortCutArg];
  }

  if (args.all) {
    const shortcuts = Object.keys(currentShortcuts);
    for (let i = 0; i < shortcuts.length; i++) {
      let course = currentShortcuts[shortcuts[i]]
      await downloadCourse(course, scientiaAPI, shortCutArg, conf, args.open, false);
    }
  } else {
    await downloadCourse(course, scientiaAPI, shortCutArg, conf, args.open);
  }

  async function downloadCourse(course: Course, materialsAPI: ScientiaAPI, shortCutArg: string, conf: ConfigStore, argvOpenFolder: boolean, openFolder: boolean = true,) {
    let folderPath = args.dir ? process.cwd() : conf.getFolderPath();
    if (!course) {
      const spinner = ora('Fetching courses...').start();
      const courses = await materialsAPI.getCourses();
      spinner.stop();
      spinner.clear();
      if (shortCutArg) {
        console.log(warning(`No course found for shortcut ${shortCutArg}, assign one below:`))
      }
      const courseNameChosen = await pickCourse(courses as Course[])
      if (shortCutArg) {
        console.log(success(`Shortcut ${shortCutArg}, assigned to ${courseNameChosen.course}!`))
      }
      course = courses.find((x: { title: string }) => x.title === courseNameChosen.course) as Course
      if (shortCutArg) {
        conf.setShortcuts(shortCutArg, course)
      }
    } else {
      console.log(chalk.blueBright(course.title))
    }

    if (argvOpenFolder) {
      open(path.join(folderPath, course.title))
      return;
    }

    const spinner2 = ora('Fetching course materials...').start();
    const resourcesResult = await materialsAPI.getCourseResources(course.code)
    const nonLinkResources = resourcesResult.data.filter((x: { type: string }) => x.type == 'file').map((x: { title: string, path: string }) => {
      x.title = path.parse(x.title).name + path.parse(x.path).ext
      return x
    }) as Resource[]
    const pdfLinkResources = resourcesResult.data.filter((x: { type: string, path: string }) => x.type == 'link' && x.path.endsWith(".pdf")) as ResourceWithLink[]
    spinner2.stop()
    spinner2.clear()
    console.log(success(`Found ${nonLinkResources.length + pdfLinkResources.length} resources!`))
    const concurrentDownloader = new ConcurrentDownloader(materialsAPI, course.title, folderPath)
    concurrentDownloader.scheduleDownloads(nonLinkResources)
    concurrentDownloader.scheduleLinkDownloads(pdfLinkResources)
    await concurrentDownloader.executeDownloads(openFolder)
  }

  // const courses: Array<Course> = await scientiaAPI.getCourses("courses/");
  // console.log(courses); 
};

main();
