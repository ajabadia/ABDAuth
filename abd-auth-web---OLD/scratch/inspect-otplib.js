const otplib = require('otplib');
console.log('Keys:', Object.keys(otplib));
if (otplib.authenticator) {
  console.log('Authenticator Keys:', Object.keys(otplib.authenticator));
}
