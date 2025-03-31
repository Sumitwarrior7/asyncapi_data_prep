import fs from 'fs';
import { save_to_jsonl } from "./fs.js";
import { github_code_files_search, processJsonlFile, fetchFileContent } from "./github_utils.js";

// Fetch asyncapi.yml files, excluding AsyncAPI and OpenAPI orgs
// github_code_files_search("asyncapi.yaml", "asyncapi_files_yaml.jsonl", 1000);
// github_code_files_search("asyncapi.yml", "asyncapi_files_yml.jsonl", 1000);
// github_code_files_search("asyncapi.json", "asyncapi_files_json.jsonl", 1000);

processJsonlFile("output/asyncapi_files_json.jsonl")