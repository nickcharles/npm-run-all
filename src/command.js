#!/usr/bin/env node

import runAll from "./index";
import Promise from "./promise";

const SUCCESS = Promise.resolve(null);

function printHelp(stdout) {
  stdout.write(`
Usage: npm-run-all [OPTIONS] [...tasks]

  Run specified tasks.

  Options:
    -h, --help                  Print this text.
    -p, --parallel [...tasks]   Run a group of tasks in parallel.
    -s, --sequential [...tasks] Run a group of tasks sequentially.
    -v, --version               Print version number.

  See Also:
    https://github.com/mysticatea/npm-run-all

`);
}

function printVersion(stdout) {
  stdout.write("v" + require("../package.json").version + "\n");
}

function createQueue(args) {
  return args.reduce((queue, arg) => {
    switch (arg) {
      case "-s":
      case "--sequential":
        queue.push({parallel: false, tasks: []});
        break;

      case "-p":
      case "--parallel":
        queue.push({parallel: true, tasks: []});
        break;

      default:
        if (arg[0] === "-") {
          throw new Error("Invalid Option: " + arg);
        }
        queue[queue.length - 1].tasks.push(arg);
        break;
    }
    return queue;
  }, [{parallel: false, tasks: []}]);
}

export default function main(
  args,
  stdout = process.stdout,
  stderr = process.stderr
) {
  if (args.length === 0) {
    args.push("--help");
  }
  switch (args[0]) {
    case "-h":
    case "--help":
      printHelp(stdout);
      return SUCCESS;

    case "-v":
    case "--version":
      printVersion(stdout);
      return SUCCESS;
  }

  let queue;
  try {
    queue = createQueue(args);
  }
  catch (err) {
    return Promise.reject(err);
  }

  return (function next() {
    const group = queue.shift();
    if (group == null) {
      return SUCCESS;
    }
    if (group.tasks.length === 0) {
      return next();
    }

    const options = {
      stdout: stdout,
      stderr: stderr,
      parallel: group.parallel
    };
    return runAll(group.tasks, options).then(next);
  })();
}

/*eslint no-process-exit:0*/
if (require.main === module) {
  main(process.argv.slice(2)).catch(err => {
    console.log("ERROR:", err.message);
    process.exit(1);
  });
}
