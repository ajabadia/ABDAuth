const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://ajabadia03_db_user:Ajabafan1974@cluster0.xarmew0.mongodb.net/';
const AUTH_DB = 'ABDElevators-Auth';
const EMAIL = 'ajabadia@gmail.com';
const USER_ID = '6989958d5b8e9e1fd921bb5a';
const NEW_PASSWORD = '11111111';

async function main() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB.');
    const db = client.db(AUTH_DB);

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(NEW_PASSWORD, salt);
    console.log('Generated hash:', hash);

    // Update users collection
    const usersCol = db.collection('users');
    const userRes = await usersCol.updateOne(
      { email: EMAIL },
      { $set: { password: hash, active: true, lockoutUntil: null, loginAttempts: 0 } }
    );
    console.log('Users collection update result:', userRes);

    // Update accounts collection
    const accountsCol = db.collection('accounts');
    const accountRes = await accountsCol.updateOne(
      { userId: USER_ID },
      { $set: { password: hash } }
    );
    console.log('Accounts collection update result:', accountRes);

    console.log('Password updated successfully for', EMAIL);
  } catch (err) {
    console.error('Error updating password:', err);
  } finally {
    await client.close();
  }
}

main();
