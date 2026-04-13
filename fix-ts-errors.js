const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) results = results.concat(walk(file));
        else if (file.endsWith('.tsx')) results.push(file);
    });
    return results;
}

try {
    walk('src/renderer/src').forEach(f => {
        let content = fs.readFileSync(f, 'utf8');
        content = content.replace(/: JSX\.Element/g, '');
        content = content.replace(/const { collapsedPanels, togglePanel } = useLayoutStore\(\)/, '');
        fs.writeFileSync(f, content);
    });

    let socketFile = 'src/renderer/src/api/secure-socket.ts';
    let sc = fs.readFileSync(socketFile, 'utf8');
    sc = sc.replace(/process\.env\.NODE_ENV === 'production'/g, 'import.meta.env.PROD');
    fs.writeFileSync(socketFile, sc);
} catch (e) {
    console.error(e);
}
