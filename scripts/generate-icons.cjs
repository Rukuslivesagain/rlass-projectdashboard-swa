// generate-icons.cjs

const fs = require("fs");
const path = require("path");

const iconFolder = path.join(__dirname, "..", "src", "resources", "icons");
const outputFile = path.join(__dirname, "..", "src", "helpers", "icons.ts");

const files = fs
    .readdirSync(iconFolder)
    .filter(file => file.endsWith(".svg"))
    .sort();

const entries = files.map(file => {

    const key = path.basename(file, ".svg");
    const svg = fs
        .readFileSync(path.join(iconFolder, file), "utf8")
        .trim();

    return `    "${key}": \`${svg}\``;

});

const output = `export const icons: Record<string, string> = {

${entries.join(",\n\n")}

};
`;

fs.writeFileSync(outputFile, output, "utf8");

console.log(`Generated ${files.length} icons.`);
console.log(outputFile);