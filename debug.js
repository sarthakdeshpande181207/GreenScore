require('dotenv').config();
const apiHandler = require('./server');

const req = {
    query: { city: 'Bangalore' }
};

const res = {
    status: (code) => ({
        json: (data) => {
            console.log('--- RESPONSE ---');
            console.log('Status:', code);
            console.log('Data:', JSON.stringify(data, null, 2));
        }
    })
};

console.log('--- STARTING DEBUG ---');
console.log('Token:', process.env.AQICN_TOKEN);
apiHandler(req, res).catch(err => console.error('Handler crashed:', err));
