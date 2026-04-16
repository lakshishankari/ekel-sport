const http = require('http');

const body = JSON.stringify({
  studentId: 'IM/2022/099',
  fullName: 'Test User',
  email: 'test-im22099@stu.kln.ac.lk',
  password: 'test1234'
});

const options = {
  hostname: '192.168.1.107',
  port: 5000,
  path: '/api/auth-otp/send-registration-otp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
};

console.log('Testing:', `http://${options.hostname}:${options.port}${options.path}`);

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('RESPONSE:', data);
  });
});

req.on('error', (e) => {
  console.log('CONNECTION ERROR:', e.message);
  console.log('Code:', e.code);
});

req.setTimeout(10000, () => {
  console.log('TIMEOUT - server not responding');
  req.destroy();
});

req.write(body);
req.end();
