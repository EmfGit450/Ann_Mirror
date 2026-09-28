import * as esbuild from "esbuild";

const watch = process.argv.includes("--watch");

const ctx = await esbuild.context({
  entryPoints: ["ts/editor.ts"],
  outfile: "dist/editor.js",

  bundle: true,
  format: "esm",
  target: "es2022",

  sourcemap: true,
  treeShaking: true,
  minify: true,

  platform: "browser",
});

if (watch) {
  await ctx.watch();
  console.log("Watching...");
} else {
  await ctx.rebuild();
  await ctx.dispose();
  console.log("Build complete.");
}
