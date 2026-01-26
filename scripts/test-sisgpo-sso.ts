import axios from 'axios';
import jwt from 'jsonwebtoken';

const SSO_SHARED_SECRET = '49ff4b860e46481e960128d82e150cd3'; // From env.ts

async function testSSO() {
    try {
        console.log('Generating SSO token...');
        const ssoToken = jwt.sign({ email: 'admin@cbmgo.com.br' }, SSO_SHARED_SECRET, { expiresIn: '1m' });

        console.log('Calling SISGPO /api/auth/sso-login directly...');
        const res = await axios.post('http://localhost:3333/api/auth/sso-login', {}, {
            headers: { Authorization: `Bearer ${ssoToken}` }
        });

        console.log('Response Status:', res.status);
        console.log('Response Data:', JSON.stringify(res.data, null, 2));

    } catch (error: any) {
        console.error('Error Status:', error.response?.status);
        console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
        console.error('Error Message:', error.message);
    }
}

testSSO();
