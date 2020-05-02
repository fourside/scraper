import { program } from "commander";

export const parse = (argv: string[]) => {
  const args = {
    dir: "",
    url: "",
  };
  program
    .version("1.0.0")
    .arguments("<dir> <url>")
    .action(function (dir: string, url: string) {
      args.dir = dir;
      args.url = url;
    })
    .on("--help", () => {
      console.log("npm start -- {dir} {targetUrl}");
    })
    .parse(argv)
  ;
  return args;
};
