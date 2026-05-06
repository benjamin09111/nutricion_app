import fs from 'fs';

function checkTagBalance(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const tags = [];
    const tagRegex = /<(\/?[a-zA-Z][a-zA-Z0-9]*)/g;
    let match;
    
    while ((match = tagRegex.exec(content)) !== null) {
        const tag = match[1];
        if (tag.startsWith('/')) {
            const closingTag = tag.substring(1);
            if (tags.length === 0) {
                console.log(`Unexpected closing tag </${closingTag}> at index ${match.index} in ${filePath}`);
            } else {
                const lastTag = tags.pop();
                if (lastTag !== closingTag) {
                    console.log(`Mismatched tag: expected </${lastTag}> but found </${closingTag}> at index ${match.index} in ${filePath}`);
                }
            }
        } else {
            // Check if it's a self-closing tag
            const rest = content.substring(match.index + tag.length + 1);
            const closeIndex = rest.indexOf('>');
            if (closeIndex !== -1) {
                const tagFull = rest.substring(0, closeIndex);
                if (!tagFull.trim().endsWith('/') && !['img', 'br', 'hr', 'input', 'link', 'meta'].includes(tag.toLowerCase())) {
                    tags.push(tag);
                }
            }
        }
    }
    
    if (tags.length > 0) {
        console.log(`${filePath}: Unclosed tags: ${tags.join(', ')}`);
    } else {
        console.log(`${filePath}: Tags balanced`);
    }
}

checkTagBalance('c:/Users/Benjamin/Desktop/nutricion_app/frontend/src/app/dashboard/pacientes/[id]/PatientDetailClient.tsx');
checkTagBalance('c:/Users/Benjamin/Desktop/nutricion_app/frontend/src/app/portal/[token]/PortalClient.tsx');
