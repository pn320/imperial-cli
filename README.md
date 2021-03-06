## Imperial CLI

### Features and TODOs
A command line interface for the Imperial scientia website. Eventually will be extended to gitlab and panopto support (see also [#4](https://github.com/pn320/imperial-cli/issues/4), and [#6](https://github.com/pn320/imperial-cli/issues/4)). For now only covers Scientia but will eventally be extended to service all of Imperial's resource platforms (Gitlab, Panopto, Scientia etc.). 

You can start using it by running the command 
```
npm i imperial-cli -g
imperial-cli [args]
```

Will be adding documentation and setting up some workflows shortly. Support and suggestions are always welcome!

```
usage: scientia [-h] [-v] [-c] [-o] [-d] [-a] [shortcut]

Materials for the Imperial Scientia website

positional arguments:
  shortcut       Shortcut to course

optional arguments:
  -h, --help     show this help message and exit
  -v, --version  show program's version number and exit
  -c, --clean    clean configuration and shortcuts
  -o, --open     open folder based off shortcut or selection
  -d, --dir      save folders in current directory instead
  -a, --all      download resources for all courses with saved shortcuts together
```

Calling it like so `imperial-cli ${shortcut_you_wish_to_assign}` will then allow you to choose from a list of the modules and select the one you'd like to assign the shortcut to, which will then be saved for the next time. Implemented with fuzzy finder so you can quickly search for the module you are looking for.

The rest of the options are fairly self explanatory, if there is anything in terms of the documentation that you feel is lacking, feel free to raise an issue!
