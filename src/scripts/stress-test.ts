
import axios from 'axios';
import 'dotenv/config';

// Config
const API_URL = process.env.SISGPO_API_URL || 'http://localhost:3333';
const CONCURRENT_REQUESTS = 50;
const TOTAL_REQUESTS = 200;
const TARGET_ENDPOINTS = [
    '/api/public/dashboard/stats',
    '/api/public/dashboard/viatura-stats-por-tipo'
];

async function stressTest() {
    console.log(`🔥 STARTING STRESS TEST targeting ${API_URL}...`);
    console.log(`   - Concurrent Workers: ${CONCURRENT_REQUESTS}`);
    console.log(`   - Total Requests: ${TOTAL_REQUESTS}`);

    const results: { endpoint: string, status: number, duration: number, success: boolean }[] = [];
    const queue = Array.from({ length: TOTAL_REQUESTS }, (_, i) => i);

    async function worker(id: number) {
        while (queue.length > 0) {
            const reqId = queue.shift();
            // Random endpoint
            const endpoint = TARGET_ENDPOINTS[Math.floor(Math.random() * TARGET_ENDPOINTS.length)];
            const url = `${API_URL}${endpoint}`;

            const start = Date.now();
            try {
                const res = await axios.get(url, { validateStatus: () => true });
                const duration = Date.now() - start;
                results.push({ endpoint, status: res.status, duration, success: res.status < 400 });
                if (reqId && reqId % 20 === 0) process.stdout.write('.');
            } catch (err: any) {
                const duration = Date.now() - start;
                results.push({ endpoint, status: 0, duration, success: false });
                process.stdout.write('x');
            }
        }
    }

    const startTotal = Date.now();
    const workers = Array.from({ length: CONCURRENT_REQUESTS }, (_, i) => worker(i));
    await Promise.all(workers);
    const totalDuration = (Date.now() - startTotal) / 1000;

    console.log('\n\n--- 📊 RESULTS ---');
    console.log(`Total Time: ${totalDuration.toFixed(2)}s`);
    console.log(`Throughput: ${(TOTAL_REQUESTS / totalDuration).toFixed(2)} req/sec`);

    const successes = results.filter(r => r.success);
    const failures = results.filter(r => !r.success);

    console.log(`Success Rate: ${((successes.length / TOTAL_REQUESTS) * 100).toFixed(1)}%`);
    console.log(`Failures: ${failures.length}`);

    // Calc average latency
    const avgLatency = results.reduce((a, b) => a + b.duration, 0) / results.length;
    console.log(`Avg Latency: ${avgLatency.toFixed(0)}ms`);

    if (failures.length > 0) {
        console.log('\n❌ Failures detected (Top 5):');
        console.log(failures.slice(0, 5));
        process.exit(1);
    } else {
        console.log('\n✅ STRESS TEST PASSED');
        process.exit(0);
    }
}

stressTest();
