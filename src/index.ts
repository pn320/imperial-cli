#!/usr/bin/env node

import { ArgumentParser } from "argparse";
import chalk from "chalk";
import ora from "ora";
import { TokenAndCredential } from "./interfaces/credentials.js";
import ConfigStore from "./lib/configstore.js";
import CredentialStore from "./lib/credentialStore.js";
import { testAuth } from "./lib/download.js";
import { getCredentials } from "./lib/prompts.js";
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
parse.add_argument('-c', '--clean', {action: 'store_true', help: "Clean configurations"});
parse.add_argument('-o', '--open', {action: 'store_true', help: "Open folder based off shortcut or selection"});
parse.add_argument('-d', '--dir', {action: 'store_true', help: "Save folders in current directory instead"});
parse.add_argument('-a', '--all', {action: 'store_true', help: "Download all shortcut courses one go"});
const args = parse.parse_args();

const credentialStore = new CredentialStore();
const conf = new ConfigStore(category);
let credentialsAndTokenStore: TokenAndCredential;

const main = async () => { 
  /**
   * Introduction to the CLI
   */
  await loadInterface();
  await delay(2000); 
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
      credentialsAndTokenStore = {credentials: existingCredentials, token: _token};
    }
  }

  /**
   * insert witty comment for this section that I'm too tired to think of. 
   */
  const scientiaAPI = new ScientiaAPI(credentialsAndTokenStore.token);
  // const courses: Array<Course> = await scientiaAPI.getCourses("courses/");
  // console.log(courses); 
};

main();
