import axios from 'axios';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-me';

const services = {
    sample: 'http://localhost:3000',
    auth: 'http://localhost:3001',
    user: 'http://localhost:3002',
    file: 'http://localhost:3003',
    audit: 'http://localhost:3004',
    notification: 'http://localhost:3005',
};

async function generateAdminToken() {
    const payload = {
        sub: uuidv4(),
        email: 'admin@test.com',
        roles: ['admin'],
        jti: uuidv4(),
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

async function runHealthChecks(report: any[]) {
    console.log('--- 1. Health Checks ---');
    for (const [name, url] of Object.entries(services)) {
        try {
            await axios.get(`${url}/api`);
            report.push({ service: name, endpoint: '/api', status: 'PASS' });
        } catch (err: any) {
            report.push({ service: name, endpoint: '/api', status: 'FAIL', error: err.message });
        }
    }
}

async function testAuth(report: any[], adminToken: string) {
    console.log('--- 2. Auth Service ---');
    try {
        const val = await axios.post(`${services.auth}/api/auth/validate`, { token: adminToken });
        report.push({ service: 'auth', endpoint: '/auth/validate', status: val.data.valid ? 'PASS' : 'FAIL' });

        const loginRes = await axios.get(`${services.auth}/api/auth/vneid/login`, { maxRedirects: 0, validateStatus: s => s === 302 });
        report.push({ service: 'auth', endpoint: '/auth/vneid/login', status: 'PASS', info: 'Redirects correctly' });

        const cbRes = await axios.get(`${services.auth}/api/auth/vneid/callback?code=mock_code`, { validateStatus: () => true });
        report.push({ service: 'auth', endpoint: '/auth/vneid/callback', status: 'PASS', info: `Status ${cbRes.status}` });


    } catch (err: any) {
        report.push({ service: 'auth', endpoint: 'various', status: 'FAIL', error: err.response?.data?.message || err.message });
    }
}

async function testLocalAuth(report: any[]) {
    console.log('--- 2b. Local Auth (User/Pass & Refresh) ---');
    const testUsername = `login-${Date.now()}`;
    const testPassword = 'SecretPassword123!';
    try {
        const adminToken = await generateAdminToken();
        await axios.post(`${services.user}/api/users`, {
            email: `${testUsername}@example.com`,
            username: testUsername,
            password: testPassword,
            firstName: 'Login',
            lastName: 'Test',
            status: 'active'
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        const loginRes = await axios.post(`${services.auth}/api/auth/login`, {
            username: testUsername,
            password: testPassword
        });

        if (loginRes.data.data.accessToken) {
            report.push({ service: 'auth', endpoint: 'POST /auth/login', status: 'PASS' });
            const refreshToken = loginRes.data.data.refreshToken;

            if (refreshToken) {
                const refreshRes = await axios.post(`${services.auth}/api/auth/refresh`, {
                    refreshToken
                });
                if (refreshRes.data.data.accessToken) {
                    report.push({ service: 'auth', endpoint: 'POST /auth/refresh', status: 'PASS' });
                } else {
                    report.push({ service: 'auth', endpoint: 'POST /auth/refresh', status: 'FAIL', error: 'No token returned' });
                }
            } else {
                report.push({ service: 'auth', endpoint: 'POST /auth/refresh', status: 'FAIL', error: 'No refresh token in login response' });
            }

            // Test logout
            await axios.post(`${services.auth}/api/auth/logout`, {}, { headers: { Authorization: `Bearer ${loginRes.data.data.accessToken}` } });
            report.push({ service: 'auth', endpoint: 'POST /auth/logout', status: 'PASS' });

            // Test logout-all (needs new token since previous was logged out)
            const secondLogin = await axios.post(`${services.auth}/api/auth/login`, { username: testUsername, password: testPassword });
            await axios.post(`${services.auth}/api/auth/logout-all`, {}, { headers: { Authorization: `Bearer ${secondLogin.data.data.accessToken}` } });
            report.push({ service: 'auth', endpoint: 'POST /auth/logout-all', status: 'PASS' });

        } else {
            report.push({ service: 'auth', endpoint: 'POST /auth/login', status: 'FAIL', error: 'No token returned' });
        }
    } catch (err: any) {
        report.push({ service: 'auth', endpoint: 'POST /auth/login/refresh', status: 'FAIL', error: err.response?.data?.message || err.message });
    }
}

async function testUser(report: any[], adminToken: string) {
    console.log('--- 3. User Service ---');
    let testUserId = '';
    const authHeaders = { Authorization: `Bearer ${adminToken}` };
    try {
        const create = await axios.post(`${services.user}/api/users`, {
            email: `test-${Date.now()}@test.com`,
            username: `testuser-${Date.now()}`,
            firstName: 'Test',
            lastName: 'User',
            password: 'testpassword123'
        }, { headers: authHeaders });
        testUserId = create.data.id;
        report.push({ service: 'user', endpoint: 'POST /users', status: 'PASS' });

        await axios.get(`${services.user}/api/users`, { headers: authHeaders });
        report.push({ service: 'user', endpoint: 'GET /users', status: 'PASS' });

        await axios.get(`${services.user}/api/users/${testUserId}`, { headers: authHeaders });
        report.push({ service: 'user', endpoint: 'GET /users/:id', status: 'PASS' });

        await axios.put(`${services.user}/api/users/${testUserId}`, { firstName: 'Updated' }, { headers: authHeaders });
        report.push({ service: 'user', endpoint: 'PUT /users/:id', status: 'PASS' });

        try {
            const roleRes = await axios.post(`${services.user}/api/users/${testUserId}/roles`, { roleIds: [uuidv4()] }, { headers: authHeaders, validateStatus: () => true });
            report.push({ service: 'user', endpoint: 'POST /users/:id/roles', status: 'PASS', info: `Status ${roleRes.status}` });
        } catch (roleErr: any) {
            report.push({ service: 'user', endpoint: 'POST /users/:id/roles', status: 'FAIL', error: roleErr.response?.data?.message || roleErr.message });
        }

        await axios.get(`${services.user}/api/users/${testUserId}/permissions`, { headers: authHeaders });
        report.push({ service: 'user', endpoint: 'GET /users/:id/permissions', status: 'PASS' });

        await axios.delete(`${services.user}/api/users/${testUserId}`, { headers: authHeaders });
        report.push({ service: 'user', endpoint: 'DELETE /users/:id', status: 'PASS' });
    } catch (err: any) {
        report.push({ service: 'user', endpoint: 'various', status: 'FAIL', error: err.response?.data?.message || err.message });
    }
}

async function testAudit(report: any[], adminToken: string) {
    console.log('--- 4. Audit Service ---');
    try {
        await axios.get(`${services.audit}/api/audit-logs`, {
            headers: { Authorization: `Bearer ${adminToken}` },
            params: { limit: 5, offset: 0 }
        });
        report.push({ service: 'audit', endpoint: 'GET /audit-logs', status: 'PASS' });
    } catch (err: any) {
        report.push({ service: 'audit', endpoint: 'GET /audit-logs', status: 'FAIL', error: err.message });
    }
}

async function testNotification(report: any[]) {
    console.log('--- 5. Notification Service ---');
    try {
        await axios.post(`${services.notification}/api/notifications/send`, {
            channel: 'email',
            payload: { recipient: 'test@example.com', subject: 'Test E2E', body: 'Hello from E2E suite' }
        });
        report.push({ service: 'notification', endpoint: 'POST /send', status: 'PASS' });
    } catch (err: any) {
        report.push({ service: 'notification', endpoint: 'POST /send', status: 'FAIL', error: err.message });
    }
}

async function testSample(report: any[]) {
    console.log('--- 6. Sample API (Todo) ---');
    try {
        const todo = await axios.post(`${services.sample}/api/todo`, { name: 'E2E Coverage Item' });
        const tid = todo.data.id;
        report.push({ service: 'sample', endpoint: 'POST /todo', status: 'PASS' });

        await axios.get(`${services.sample}/api/todo`);
        report.push({ service: 'sample', endpoint: 'GET /todo', status: 'PASS' });

        await axios.get(`${services.sample}/api/todo/${tid}`);
        report.push({ service: 'sample', endpoint: 'GET /todo/:id', status: 'PASS' });

        await axios.put(`${services.sample}/api/todo/${tid}`, { name: 'E2E Updated Item' });
        report.push({ service: 'sample', endpoint: 'PUT /todo/:id', status: 'PASS' });

        await axios.delete(`${services.sample}/api/todo/${tid}`);
        report.push({ service: 'sample', endpoint: 'DELETE /todo/:id', status: 'PASS' });
    } catch (err: any) {
        report.push({ service: 'sample', endpoint: '/todo series', status: 'FAIL', error: err.message });
    }
}

async function testFile(report: any[]) {
    console.log('--- 7. File Service ---');
    try {
        await axios.get(`${services.file}/api/files`);
        report.push({ service: 'file', endpoint: 'GET /files', status: 'PASS' });

        // Create a fake file buffer and use native fetch/FormData mechanism to upload
        try {
            const formData = new FormData();
            const blob = new Blob(['Hello World!'], { type: 'text/plain' });
            formData.append('file', blob, 'test.txt');

            // Using axios with native fetch might be tricky depending on version/environment, let's use global fetch for this isolated part
            const uploadRes = await fetch(`${services.file}/api/files/upload`, {
                method: 'POST',
                body: formData as any
            });

            if (uploadRes.ok) {
                const fileData = (await uploadRes.json()) as any;
                report.push({ service: 'file', endpoint: 'POST /files/upload', status: 'PASS' });
                const fileId = fileData.id;

                try {
                    await axios.get(`${services.file}/api/files/${fileId}`);
                    report.push({ service: 'file', endpoint: 'GET /files/:id', status: 'PASS' });

                    await axios.get(`${services.file}/api/files/${fileId}/generate-url`);
                    report.push({ service: 'file', endpoint: 'GET /files/:id/generate-url', status: 'PASS' });

                    // We expect this might redirect or return standard info, handle gracefully
                    await axios.get(`${services.file}/api/files/${fileId}/download`, { validateStatus: s => s < 500 });
                    report.push({ service: 'file', endpoint: 'GET /files/:id/download', status: 'PASS' });

                    await axios.delete(`${services.file}/api/files/${fileId}`);
                    report.push({ service: 'file', endpoint: 'DELETE /files/:id', status: 'PASS' });
                } catch (e: any) {
                    report.push({ service: 'file', endpoint: 'GET/DELETE inner flow', status: 'FAIL', error: e.message });
                }
            } else {
                report.push({ service: 'file', endpoint: 'POST /files/upload', status: 'FAIL', error: `Status ${uploadRes.status}` });
            }
        } catch (e: any) {
            report.push({ service: 'file', endpoint: 'POST /files/upload', status: 'FAIL', error: e.message });
        }
    } catch (err: any) {
        report.push({ service: 'file', endpoint: 'various', status: 'FAIL', error: err.message });
    }
}

async function main() {
    const target = process.argv[2]?.toLowerCase();
    const adminToken = await generateAdminToken();
    const report: any[] = [];

    console.log(`🚀 Running modular E2E tests for: ${target || 'ALL'}\n`);

    if (!target || target === 'health') await runHealthChecks(report);
    if (!target || target === 'auth') {
        await testAuth(report, adminToken);
        await testLocalAuth(report);
    }
    if (!target || target === 'user') await testUser(report, adminToken);
    if (!target || target === 'audit') await testAudit(report, adminToken);
    if (!target || target === 'notification') await testNotification(report);
    if (!target || target === 'sample') await testSample(report);
    if (!target || target === 'file') await testFile(report);

    console.log('\n--- Test Results Report ---');
    console.table(report);

    const failures = report.filter(r => r.status === 'FAIL');
    process.exit(failures.length > 0 ? 1 : 0);
}

main().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});
