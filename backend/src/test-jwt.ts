import * as jwt from 'jsonwebtoken';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIyLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzMxNTMwNjIsImV4cCI6MTc3MzIzOTQ2Mn0.VECBq4a8HdCrLV_tyB-iI0cJ0e8dogJb2UTfaSTYCyg';

try {
  const result = jwt.verify(token, 'TMS_SECRET_2026');
  console.log('✅ Token valid:', result);
} catch(e) {
  console.log('❌ Token invalid:', e.message);
}