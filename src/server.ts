import express, { Request, Response } from 'express';
import dotenv from 'dotenv'
dotenv.config()
import cors from 'cors';
import { connectDB, tokensCollection } from './db';
import admin from 'firebase-admin';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert('etc/secrets/serviceAccountKey.json')
})

async function startServer() {
  try {
    await connectDB();

  
    app.post('/save-token', async (req: Request, res: Response) => {
      const { token } = req.body;
      if (!token) return res.status(400).json({ message: 'Invalid request parameters' });

      try {
      
        const existing = await tokensCollection.findOne({ token });
        if (existing) return res.status(200).json({ message: 'Token already saved' });

       
        await tokensCollection.deleteMany({}); 

        await tokensCollection.insertOne({ token, createdAt: new Date() });
        return res.status(201).json({ message: 'Token saved successfully' });
      } catch (err) {
        console.error('Errore salvando token:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }
    });

    app.post('/send-notification', async (req: Request, res: Response) => {
      const { fullName, projectType, budget } = req.body;
      if (!fullName || !projectType || !budget) {
        return res.status(400).json({ message: 'Invalid request parameters' });
      }
      let tokenDoc: any = null;
      try {
        tokenDoc = await tokensCollection.findOne();
        if (!tokenDoc) return res.status(404).json({ message: 'No token found' });

        const message = {
          notification: {
            title: "Nuovo progetto da Gmail",
            body: `Hai un messaggio da ${fullName} per il progetto "${projectType}" con budget ${budget}€`
          },
          android: {
            priority: 'high' as 'high',
            
            
            notification: {
              channelId: 'default',
              icon: 'gmail',
              sound: 'default',
              color:'#f7f7f7',
            },
          },
          token: tokenDoc.token,
        };

        const response = await admin.messaging().send(message);
        return res.status(200).json({ message: 'Notification sent successfully', response });
      } catch (err: any) {
        console.error('Errore inviando notifica:', err);
       
        if (err.code === 'messaging/registration-token-not-registered') {
          if (tokenDoc) await tokensCollection.deleteOne({ token: tokenDoc.token });
        }
        return res.status(500).json({ message: 'Internal server error' });
      }
    });

    app.listen(port, () => {
      console.log(`🚀 Server listening on port ${port}`);
    });

  } catch (err) {
    console.error('❌ Errore connessione MongoDB:', err);
  }
}

startServer();
