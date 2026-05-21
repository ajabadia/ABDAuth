import * as otplib from 'otplib';

console.log('Keys in otplib:', Object.keys(otplib));
if (otplib.authenticator) {
    console.log('authenticator methods:', Object.keys(otplib.authenticator));
}
if (otplib.totp) {
    console.log('totp methods:', Object.keys(otplib.totp));
}
if ((otplib as any).verify) {
    console.log('verify exists as top-level');
}
