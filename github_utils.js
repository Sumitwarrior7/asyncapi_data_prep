import fs from 'fs';
import { save_to_jsonl } from "./fs.js";
import dotenv from "dotenv";
dotenv.config();

/**
 * Searches GitHub for code files based on filters and saves the results to a JSONL file.
 * @param {string} fileName - The file name to search (e.g., "asyncapi.yml").
 * @param {string} outputFileName - The output JSONL file name.
 * @param {number} max_files - The maximum number of files to retrieve.
 */
async function github_code_files_search(fileName, outputFileName, max_files) {
    const GITHUB_API_URL = "https://api.github.com/search/code";
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    
    let totalFetched = 0;
    let page = 1;
    const allResults = [];
    
    while (totalFetched < max_files) {
        const query = `filename:${fileName}`;
        const url = `${GITHUB_API_URL}?q=${query}&per_page=100&page=${page}`;
        
        const headers = {
            "Accept": "application/vnd.github.v3+json",
            "Authorization": `Bearer ${GITHUB_TOKEN}`
        };
        
        console.log(`🔍 Searching GitHub with query: ${query} (Page ${page})`);
        
        try {
            const response = await fetch(url, { headers });
            console.log(`Response status: ${response.status}, Rate limit remaining: ${response.headers.get("x-ratelimit-remaining")}`);
            
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`GitHub API error: ${response.status} - ${errorBody}`);
            }
            
            const data = await response.json();
            const items = data.items || [];
            
            if (items.length === 0) break; // Stop if no more results
            
            console.log(`✅ Found ${items.length} matching files.`);
            
            const results = items.map((item) => ({
                repo: item.repository.full_name,
                file_name: item.name,
                file_path: item.path,
                download_url: item.html_url,
            }));
            
            allResults.push(...results);
            
            totalFetched += results.length;
            page++;
        } catch (error) {
            console.error("❌ Error fetching from GitHub API:", error.message);
            break;
        }
    }
    save_to_jsonl("output/" + outputFileName, allResults);
    
    console.log(`🔹 Search complete. Total files fetched: ${totalFetched}`);
}

async function fetchFileContent(api_url) {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const headers = {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": `Bearer ${GITHUB_TOKEN}`
    };

    try {
        const response = await fetch(api_url, { headers });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const data = await response.json();
        return Buffer.from(data.content, 'base64').toString('utf-8'); // Decode Base64 content
    } catch (error) {
        console.error("❌ Error fetching file content:", error.message);
        return null;
    }
}

async function processJsonlFile(file_name) {
    let fileContent;
    try {
        fileContent = fs.readFileSync(file_name, 'utf-8');
    } catch (error) {
        console.error('❌ Error reading file:', error.message);
        return;
    }

    const lines = fileContent.split('\n').filter(line => line.trim());
    const updatedLines = [];

    
    for (const line of lines) {
        let jsonObject;
        try {
            jsonObject = JSON.parse(line);
        } catch (error) {
            console.error('❌ Error parsing JSON:', error.message);
            continue;
        }

        if (!jsonObject.repo || !jsonObject.file_path) {
            console.warn('⚠️ Skipping entry due to missing repo or file_path:', jsonObject);
            continue;
        }

        const { repo, file_path } = jsonObject;
        const api_url = `https://api.github.com/repos/${repo}/contents/${file_path}`;
        
        console.log(`🔍 Fetching content for ${repo}/${file_path}`);
        jsonObject.content = await fetchFileContent(api_url);
        
        updatedLines.push(JSON.stringify(jsonObject));
    }

    try {
        fs.writeFileSync(file_name, updatedLines.join('\n'), 'utf-8');
        console.log('✅ Processing complete. File updated:', file_name);
    } catch (error) {
        console.error('❌ Error writing file:', error.message);
    }
}



export { github_code_files_search, fetchFileContent, processJsonlFile };