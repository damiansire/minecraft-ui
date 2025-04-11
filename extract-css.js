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

// Function to process all HTML files in a directory
function processDirectory(inputDir, outputDir) {
    // Make sure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Read all HTML files in input directory
    const files = fs.readdirSync(inputDir);
    
    files.forEach(file => {
        if (file.endsWith('.html')) {
            const inputPath = path.join(inputDir, file);
            const cssOutputPath = path.join(outputDir, file.replace('.html', '.css'));
            const htmlOutputPath = path.join(outputDir, file);
            
            try {
                const { css, html } = extractCSS(inputPath, cssOutputPath);
                
                // Save extracted CSS
                fs.writeFileSync(cssOutputPath, css);
                
                // Save updated HTML
                fs.writeFileSync(htmlOutputPath, html);
                
                console.log(`Processed ${file}:`);
                console.log(`- CSS saved to ${cssOutputPath}`);
                console.log(`- Updated HTML saved to ${htmlOutputPath}`);
            } catch (error) {
                console.error(`Error processing ${file}:`, error.message);
            }
        }
    });
}

// Input and output directories
const inputDir = path.join(__dirname, 'test', 'input');
const outputDir = path.join(__dirname, 'test', 'output');

// Process files
processDirectory(inputDir, outputDir); 