const http = require('http');

const data = JSON.stringify({
    latitude: 25.6100,
    longitude: 85.1300,
    serviceType: 'Electrician',
    radius: 30 // Testing standard 30km radius
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/technicians/search',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('Sending request to localhost:3000...');

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        try {
            const parsed = JSON.parse(body);
            console.log('RESPONSE:', JSON.stringify(parsed, null, 2));
            if (parsed.logs) {
                console.log('\n--- SERVER DEBUG LOGS ---');
                parsed.logs.forEach(l => console.log(l));
            }
        } catch (e) {
            console.log('RAW RESPONSE:', body);
        }
    });
});

req.on('error', (error) => {
    console.error('ERROR:', error);
});

req.write(data);
req.end();
