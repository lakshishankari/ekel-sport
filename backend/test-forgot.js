const axios = require('axios');

async function testForgotPassword() {
    try {
        const response = await axios.post('http://localhost:5000/auth/forgot-password', {
            email: 'diwanja-im22051@stu.kln.ac.lk'
        });
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testForgotPassword();
