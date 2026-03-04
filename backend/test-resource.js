const http = require('http');

const data = JSON.stringify({
    title: 'Test',
    content: 'Test content',
    category: 'consejos',
    tags: [],
    sources: '',
    isGlobal: false
});

const req = http.request({
    hostname: 'localhost',
    port: 3001,
    path: '/resources',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
        // We don't have a token, so we expect a 401 instead of a 500, but maybe we can bypass it or see if it gives 401
    }
}, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => console.log('Status:', res.statusCode, 'Body:', body));
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
