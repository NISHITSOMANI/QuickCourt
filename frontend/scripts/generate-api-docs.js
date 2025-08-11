#!/usr/bin/env node

/**
 * API Documentation Generator
 * 
 * This script generates comprehensive API documentation from our API configuration
 * and utilities. It creates markdown files that can be viewed in GitHub or other
 * markdown viewers.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  outputDir: './docs/api',
  sourceFiles: [
    '../src/api/config.js',
    '../src/utils/apiErrorHandler.js',
    '../src/hooks/useApiRequest.js',
    '../src/utils/apiCache.js',
    '../src/utils/retryRequest.js',
    '../src/utils/apiLogger.js',
    '../src/utils/apiCancellation.js',
    '../src/utils/apiRateLimiter.js',
    '../src/utils/apiTransformers.js'
  ].map(p => path.join(__dirname, p)),
  baseUrl: 'https://github.com/your-org/quickcourt/blob/main',
  repoUrl: 'https://github.com/your-org/quickcourt'
};

/**
 * Ensure the output directory exists
 */
function ensureOutputDir() {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
}

/**
 * Extract JSDoc comments from a file
 */
function extractJsDoc(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const jsdocRegex = /\/\*\*[\s\S]*?\*\//g;
  const matches = content.match(jsdocRegex) || [];
  
  return matches.map(doc => {
    // Extract description, params, returns, etc.
    const lines = doc.split('\n').map(line => line.trim().replace(/^\*\s?/, ''));
    const description = [];
    const params = [];
    let returns = '';
    let currentSection = 'description';
    
    for (const line of lines) {
      if (line.startsWith('@param')) {
        currentSection = 'param';
        const paramMatch = line.match(/@param\s+\{([^}]+)}\s+(\w+)(?:\s+-\s+(.+))?/);
        if (paramMatch) {
          params.push({
            name: paramMatch[2],
            type: paramMatch[1],
            description: paramMatch[3] || ''
          });
        }
      } else if (line.startsWith('@returns')) {
        currentSection = 'returns';
        const returnMatch = line.match(/@returns\s+\{([^}]+)}(?:\s+-\s+(.+))?/);
        if (returnMatch) {
          returns = {
            type: returnMatch[1],
            description: returnMatch[2] || ''
          };
        }
      } else if (line.startsWith('@')) {
        currentSection = 'other';
      } else if (line.trim() && currentSection === 'description') {
        description.push(line);
      } else if (line.trim() && currentSection === 'param') {
        // Add to the last parameter's description
        if (params.length > 0) {
          params[params.length - 1].description += ' ' + line.trim();
        }
      } else if (line.trim() && currentSection === 'returns') {
        returns.description += ' ' + line.trim();
      }
    }
    
    return {
      description: description.join(' ').trim(),
      params,
      returns
    };
  });
}

/**
 * Generate markdown documentation for a file
 */
function generateFileDocs(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  const fileName = path.basename(filePath);
  const fileUrl = `${CONFIG.baseUrl}/${relativePath}`;
  
  // Extract JSDoc comments
  const docs = extractJsDoc(filePath);
  
  // Generate markdown
  let markdown = `# ${fileName}\n\n`;
  markdown += `[View Source](${fileUrl})\n\n`;
  
  // Add file-level documentation
  if (docs.length > 0 && docs[0].description) {
    markdown += `${docs[0].description}\n\n`;
  }
  
  // Add function documentation
  docs.forEach((doc, index) => {
    if (index === 0) return; // Skip file-level doc
    
    markdown += `## ${doc.description.split('\n')[0]}\n\n`;
    
    if (doc.params && doc.params.length > 0) {
      markdown += '### Parameters\n\n';
      markdown += '| Name | Type | Description |\n';
      markdown += '|------|------|-------------|\n';
      
      doc.params.forEach(param => {
        markdown += `| ${param.name} | \`${param.type}\` | ${param.description} |\n`;
      });
      
      markdown += '\n';
    }
    
    if (doc.returns) {
      markdown += '### Returns\n\n';
      markdown += `**Type:** \`${doc.returns.type}\`\n\n`;
      markdown += `${doc.returns.description}\n\n`;
    }
    
    markdown += '---\n\n';
  });
  
  return {
    fileName: fileName.replace('.js', '.md'),
    content: markdown
  };
}

/**
 * Generate the main README with links to all API documentation
 */
function generateReadme(files) {
  let readme = '# QuickCourt API Documentation\n\n';
  readme += 'This directory contains automatically generated API documentation for the QuickCourt frontend.\n\n';
  readme += '## Available Documentation\n\n';
  
  files.forEach(file => {
    const docName = file.fileName.replace('.md', '');
    readme += `- [${docName}](${file.fileName})\n`;
  });
  
  readme += '\n## Contributing\n\n';
  readme += 'This documentation is automatically generated from JSDoc comments in the source code. ';
  readme += `To update the documentation, edit the source files in [${CONFIG.repoUrl}](CONFIG.repoUrl) `;
  readme += 'and run `npm run generate-api-docs`.\n';
  
  return {
    fileName: 'README.md',
    content: readme
  };
}

/**
 * Main function to generate all API documentation
 */
function generateApiDocs() {
  try {
    console.log('Generating API documentation...');
    ensureOutputDir();
    
    // Process each source file
    const docs = CONFIG.sourceFiles.map(filePath => {
      console.log(`Processing ${filePath}...`);
      return generateFileDocs(filePath);
    });n    
    // Add README
    docs.push(generateReadme(docs));
    
    // Write files
    docs.forEach(doc => {
      const outputPath = path.join(CONFIG.outputDir, doc.fileName);
      fs.writeFileSync(outputPath, doc.content);
      console.log(`Generated ${outputPath}`);
    });
    
    console.log('\nAPI documentation generated successfully!');
    console.log(`Output directory: ${path.resolve(CONFIG.outputDir)}`);
    
  } catch (error) {
    console.error('Error generating API documentation:', error);
    process.exit(1);
  }
}

// Run the generator
generateApiDocs();
