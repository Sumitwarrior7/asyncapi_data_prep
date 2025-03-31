const fs = require("fs");
const axios = require("axios");

/**
 * Saves a list of JSON objects to a JSONL file.
 * @param {string} fileName - The output file name.
 * @param {Array} dataList - The list of JSON objects.
 */
function save_to_jsonl(fileName, dataList) {
    const jsonlData = dataList.map((obj) => JSON.stringify(obj)).join("\n");
    fs.writeFileSync(fileName, jsonlData, "utf-8");
    console.log(`✅ Data saved to ${fileName}`);
}


module.exports = { save_to_jsonl };
