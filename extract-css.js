import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Function to clean CSS
function cleanCSS(css) {
    return css
        .replace(/^\s+/gm, '')  // Remove spaces at the beginning of each line
        .replace(/\s*\/\*\s*([^*]|\*(?!\/))*\*\/\s*/g, '\n') // Remove comments
        .replace(/\n{3,}/g, '\n\n')  // Reduce multiple blank lines to maximum two
        .trim();
}

// Function to extract CSS and update HTML
function extractCSS(htmlFilePath, cssOutputPath) {
    // Read HTML file
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
    
    // Create virtual DOM
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    
    // Extract all styles
    const styles = [];
    const styleElements = document.querySelectorAll('style');
    
    styleElements.forEach(style => {
        styles.push(style.textContent);
        style.remove(); // Remove style element from HTML
    });

    // Create CSS link
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = path.basename(cssOutputPath);
    
    // Insert link in head
    const head = document.querySelector('head');
    head.insertBefore(cssLink, head.firstChild);

    // Get updated HTML
    const updatedHtml = dom.serialize();
    
    return {
        css: cleanCSS(styles.join('\n\n')),
        html: updatedHtml
    };
}

// Function to find all HTML files recursively
function findHtmlFiles(dir) {
    let results = [];
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            // Skip node_modules and dist directories
            if (file !== 'node_modules' && file !== 'dist') {
                results = results.concat(findHtmlFiles(filePath));
            }
        } else if (file.endsWith('.html')) {
            results.push(filePath);
        }
    });
    
    return results;
}

// Function to process all HTML files in a directory
function processDirectory(inputDir, outputDir) {
    // Make sure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Find all HTML files recursively
    const htmlFiles = findHtmlFiles(inputDir);
    
    htmlFiles.forEach(filePath => {
        const file = path.basename(filePath);
        const folderName = file.replace('.html', '');
        const folderPath = path.join(outputDir, folderName);
        
        // Create folder for this HTML file
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }
        
        const cssOutputPath = path.join(folderPath, `${folderName}.css`);
        const htmlOutputPath = path.join(folderPath, file);
        
        try {
            const { css, html } = extractCSS(filePath, cssOutputPath);
            
            // Save extracted CSS
            fs.writeFileSync(cssOutputPath, css);
            
            // Save updated HTML
            fs.writeFileSync(htmlOutputPath, html);
            
            console.log(`Processed ${file}:`);
            console.log(`- Created folder: ${folderPath}`);
            console.log(`- CSS saved to ${cssOutputPath}`);
            console.log(`- Updated HTML saved to ${htmlOutputPath}`);
        } catch (error) {
            console.error(`Error processing ${file}:`, error.message);
        }
    });
}

// Input and output directories
const inputDir = __dirname; // Use the project root directory
const outputDir = path.join(__dirname, 'output'); // Create output in the project root

// Process files
processDirectory(inputDir, outputDir); 