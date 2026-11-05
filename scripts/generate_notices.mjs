import {
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  mkdirSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
const visited = new Set(),
  notices = [];
function collect(name, from) {
  if (visited.has(name)) return;
  const require = createRequire(join(from, "package.json"));
  let file;
  try {
    file = require.resolve(`${name}/package.json`);
  } catch {
    try {
      let dir = dirname(require.resolve(name));
      while (true) {
        if (existsSync(join(dir, "package.json"))) {
          const p = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
          if (p.name === name) {
            file = join(dir, "package.json");
            break;
          }
        }
        const parent = dirname(dir);
        if (parent === dir) break;
        dir = parent;
      }
    } catch {
      /* Optional platform dependency. */
    }
  }
  if (!file) return;
  const dir = dirname(file),
    pkg = JSON.parse(readFileSync(file, "utf8"));
  visited.add(name);
  const license = readdirSync(dir).filter((x) =>
    /^licen[sc]e(?:\.|$)/i.test(x),
  );
  notices.push(
    `\n${"=".repeat(70)}\n${name} ${pkg.version} — ${typeof pkg.license === "string" ? pkg.license : "ver package.json"}\n${license.map((x) => readFileSync(join(dir, x), "utf8")).join("\n") || pkg.homepage || pkg.repository?.url || ""}\n`,
  );
  for (const dependency of Object.keys(pkg.dependencies || {}))
    collect(dependency, dir);
}
const project = JSON.parse(readFileSync("package.json", "utf8"));
for (const name of Object.keys(project.dependencies))
  collect(name, process.cwd());
mkdirSync("public/licenses", { recursive: true });
writeFileSync(
  "public/licenses/THIRD-PARTY.txt",
  "DataViz Hub — Licenças das dependências de produção\n" +
    notices.sort().join("\n"),
);
writeFileSync("public/licenses/MIT.txt", readFileSync("LICENSE"));
console.log(
  `Avisos de ${visited.size} dependências de produção incluídos na distribuição.`,
);
