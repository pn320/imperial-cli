import chalk from 'chalk';
import figlet from 'figlet';
import gradient from "gradient-string";

export const intro = chalk.hex('#64c8fa');

export const loadInterface = async (): Promise<void> => {
  figlet("Imperial CLI!", async (_, data) => {
    if (data) {
      console.log(gradient.mind(data));
    }
  });
}

/**
 * TODO: Maybe figure out a way to replace the animation instead of clearing the screen
 */
export const clearScreen = (): void => {
  console.log("\\033[2J");
  console.log('\u001b[H\u001b[2J\u001b[3J');
  console.log(chalk.greenBright(`Scientia CLI v${"1.0.0"}`));
};