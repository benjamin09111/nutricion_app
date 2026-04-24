
import fs from 'fs';

const content = fs.readFileSync('c:/Users/benja/OneDrive/Desktop/nutricion_app/frontend/src/app/dashboard/recetas/RecipesClient.tsx', 'utf8');

function checkBalance(text) {
    let parens = 0;
    let braces = 0;
    let brackets = 0;
    let inString = false;
    let stringChar = '';
    let inComment = false;
    let inRegex = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const next = text[i+1];

        if (inComment) {
            if (char === '*' && next === '/') {
                inComment = false;
                i++;
            } else if (char === '\n') {
                // single line comments end at newline, but we only handle multi-line here for simplicity
                // Actually, let's handle single line too
            }
            continue;
        }

        if (text[i] === '/' && text[i+1] === '/') {
            // Skip until end of line
            while (i < text.length && text[i] !== '\n') i++;
            continue;
        }

        if (text[i] === '/' && text[i+1] === '*') {
            inComment = true;
            i++;
            continue;
        }

        if (inString) {
            if (char === stringChar && text[i-1] !== '\\') {
                inString = false;
            }
            continue;
        }

        if (char === '"' || char === "'" || char === '`') {
            inString = true;
            stringChar = char;
            continue;
        }

        if (char === '(') parens++;
        if (char === ')') parens--;
        if (char === '{') braces++;
        if (char === '}') {
            braces--;
            if (braces === 0) {
                console.log('Braces hit 0 at line', text.substring(0, i).split('\n').length);
            }
        }
        if (char === '[') brackets++;
        if (char === ']') brackets--;

        if (parens < 0) console.log('Parens negative at line', text.substring(0, i).split('\n').length);
        if (braces < 0) console.log('Braces negative at line', text.substring(0, i).split('\n').length);
        if (brackets < 0) console.log('Brackets negative at line', text.substring(0, i).split('\n').length);
    }

    console.log('Final counts:', { parens, braces, brackets });
}

checkBalance(content);
