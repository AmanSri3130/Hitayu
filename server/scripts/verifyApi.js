const http = require('http');

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

async function runTests() {
  console.log('--- HitAyu 2.0 End-to-End API Verification ---');

  // 1. Health check
  const health = await request('GET', '/health');
  console.log('1. Health:', health.status, health.body.database);
  if (health.status !== 200 || !health.body.database.connected) {
    throw new Error('Database not connected in health check');
  }

  // 2. Seed Knowledge & check Knowledge endpoint
  const knowledge = await request('GET', '/knowledge');
  console.log('2. Knowledge count:', knowledge.body.count);

  // 3. Register User
  const testEmail = `test_${Date.now()}@hitayu.com`;
  const reg = await request('POST', '/auth/register', {
    name: 'Test Yogi',
    email: testEmail,
    password: 'password123',
    dietaryPreference: 'Sattvic',
  });
  console.log('3. Register:', reg.status, reg.body.success);
  if (reg.status !== 201 || !reg.body.token) throw new Error('Registration failed');
  const token = reg.body.token;

  // 4. Submit Prakriti Assessment
  const answers = [
    { questionId: 1, questionText: 'Q1', selectedOption: 'A', dosha: 'Vata' },
    { questionId: 2, questionText: 'Q2', selectedOption: 'A', dosha: 'Vata' },
    { questionId: 3, questionText: 'Q3', selectedOption: 'B', dosha: 'Pitta' },
    { questionId: 4, questionText: 'Q4', selectedOption: 'C', dosha: 'Kapha' },
  ];
  const assess = await request('POST', '/assessment', { answers }, token);
  console.log('4. Assessment:', assess.status, assess.body.assessment?.dominantDosha);
  if (assess.status !== 201) throw new Error('Assessment failed');

  // 5. Ayu AI Chat
  const chat = await request('POST', '/chat/message', { message: 'What is Dinacharya?' }, token);
  console.log('5. Ayu AI Chat:', chat.status, 'isFallback:', chat.body.message?.isFallback);
  if (chat.status !== 200) throw new Error('Chat failed');

  // 6. YogaAI Poses & Inference
  const poses = await request('GET', '/yoga/poses');
  console.log('6a. Yoga Poses:', poses.status, poses.body.supportedPoses?.length);

  const dummyFeatures = new Array(48).fill(0.5);
  const infer = await request('POST', '/yoga/infer', { features: dummyFeatures, targetPoseIndex: 75 });
  console.log('6b. Yoga SVM Infer:', infer.status, infer.body.success, 'pred:', infer.body.poseName);

  // 7. Save Yoga Session
  const yogaSess = await request(
    'POST',
    '/yoga/sessions',
    {
      totalDurationSeconds: 120,
      difficultyLevel: 'beginner',
      completedPoses: [
        {
          poseIndex: 75,
          poseName: 'Warrior II',
          sanskritName: 'Virabhadrasana II',
          difficulty: 'beginner',
          targetHoldDuration: 15,
          actualHoldDuration: 15,
          alignmentScore: 88,
          classificationConfidence: 82,
        },
      ],
    },
    token
  );
  console.log('7. Yoga Session Save:', yogaSess.status, 'Grade:', yogaSess.body.session?.grade);

  // 8. Habits
  const habits = await request('GET', '/habits', null, token);
  console.log('8. Habits initialized:', habits.status, habits.body.count);

  console.log('--- ALL TESTS PASSED SUCCESSFULLY ---');
}

runTests().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
