const bcrypt = require('bcryptjs');

const hash = '$2b$10$yyOq4F.CxwE.3bmHH3dej.TSTMOmPXSt/gzs9j419JMr8prsdhIOu';
const pass = '11111111';

async function testPass() {
  const match = await bcrypt.compare(pass, hash);
  console.log(`Password '11111111' matches hash? ${match}`);
}

testPass();
