import chalk from "chalk";
import Fuse from "fuse.js";
import inquirer from "inquirer";
import inquirerPrompt from "inquirer-autocomplete-prompt";
import ora from "ora";
import os from "os";
import path from "path";
import { Course } from "../interfaces/course.js";
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

export const pickCourse = async (list: Course[]) => {
  inquirer.registerPrompt('autocomplete', inquirerPrompt);

  const questions = [
      {
          name: 'course',
          type: 'autocomplete',
          message: 'Pick course:',
          source: (_: any, input: string) => {
              if (input) {
                  const options = {
                      includeScore: true,
                      keys: ['title', 'code']
                  }
                  const fuse = new Fuse(list, options)
                  const result = fuse.search(input)
                  return result.map(x => x.item.title)
              } else {
                  return list.map((x: Course) => x.title)
              }
          },
          validate: function (value: { name: string; }) {
              const course = list.find(x => x.title === value.name) as Course
              if (course.has_materials) {
                  return true;
              } else {
                  return 'This course has no materials, sorry!';
              }
          }

      }
  ];
  return inquirer.prompt(questions);
}

export const setFolder = async () => {
  const questions = [
    {
      name: 'folderPath',
      type: 'input',
      default: path.join(os.homedir(), "Desktop", "Imperial", "Scientia"),
      message: 'Enter the default path for saving all material:',
      validate: function (value: string) {
        if (value.length) {
          return true;
        } else {
          return 'Please enter the path for saving all materials:';
        }
      }
    }
  ];
  return inquirer.prompt(questions);
}

export const promptOpenFolder = async () => {
  const questions = [
      {
          name: 'openFolder',
          type: 'confirm',
          default: true,
          message: 'Open Folder ?'
      }
  ];
  return inquirer.prompt(questions);
}