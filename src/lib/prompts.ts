import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import { ResponseCredential, TokenAndCredential } from "../interfaces/credentials.js";
import { check, cross, success, warning } from "../utils/constants.js";
import { delay } from "../utils/delay.js";
import { testAuth } from "./download.js";

export const getCredentials = async (): Promise<TokenAndCredential> => {
  const prompts = [
    {
      name: 'username',
      type: 'input',
      message: 'Enter your imperial shortcode:',
      default: function () {
        return '';
      },
      validate: function (value: string): string | boolean {
        return !!value ? true : 'Please enter your shortcode!';
      }
    },
    {
      name: 'password',
      type: 'password',
      message: 'Enter your imperial password:',
      default: function () {
        return '';
      },
      validate: function (value: string): string | boolean {
        return !!value ? true : 'Please enter your password!';
      }
    }
  ]

  /**
   * Don't know why the type and id fields are randomly getting added onto it.
   * Inquirer thing?
   */
  const response: ResponseCredential = await inquirer.prompt(prompts);
  
  /**
   * Cannot for the life of me figure out how to get the spinner to run while the background task runs.
   * Also need more than a millisecond of delay to show the coolness of the spinner.
   */
  const spinner = ora('authenticating credentials').start();
  await delay(250);
  const _token = await testAuth(response);
  spinner.stop();
  
  /**
   * Basic authentication stuff, design choice -> add the depth here or in the main entry point of the program? Feels like it belongs in the main file.
   */
  if (!_token) {
    console.log(chalk.red(`${cross} could not authenticate your identity!`));
    console.log(warning('are you sure entered the right credentials?'));
    return getCredentials();
  }
  else {
    console.log(success(`${check} successefully authenticated and signed in!`));
    return {credentials: response, token: _token};
  }
}