import chalk from "chalk";

export const __materials_api__ = "https://api-materials.doc.ic.ac.uk/auth/login"
export const category = "scientia"
export const warning = chalk.hex('#FFA500');
export const success = chalk.hex('#64c8c8');
export const courseColor = chalk.hex('#f78da7')
export const check = "\u2714";
export const cross = "\u2718";
export const currentYearShift = (): string => {
  const date = new Date();
  const year = date.getFullYear() - 2000;
  return date.getMonth() >= 9 ? String(2100 + year + 1) : String(2100 + year);
}
export const __scientia_base_path__ = `https://api-materials.doc.ic.ac.uk/`