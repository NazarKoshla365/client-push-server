import { MongoClient, Db, Collection } from 'mongodb';

const uri = 'mongodb+srv://nazarkoshladev_db_user:mp0PqZJKLgwUWiYp@cluster0.cukfbkg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);

let db: Db;
let tokensCollection: Collection;

export async function connectDB() {
  await client.connect();
  db = client.db('fcm-tokens');
  tokensCollection = db.collection('tokens');
  console.log('✅ Connesso a MongoDB senza Mongoose');
}

export { db, tokensCollection };
