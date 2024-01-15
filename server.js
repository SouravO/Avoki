const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { MongoClient } = require('mongodb');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const mongoURI = 'mongodb+srv://osourav5:Zr8yDCNAF62BGo6G@cluster0.u8i84kn.mongodb.net/bookingDB';

MongoClient.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
    if (err) {
        console.error(err);
        return;
    }

    console.log('Connected to MongoDB');

    const db = client.db('bookingDB');
    const bookedDatesCollection = db.collection('booked_dates');

    let bookedDates = [];

    bookedDatesCollection.find().toArray((err, docs) => {
        if (err) {
            console.error(err);
            return;
        }

        bookedDates = docs.map(doc => doc.date);
        io.emit('updateDates', bookedDates);
    });

    io.on('connection', (socket) => {
        socket.emit('updateDates', bookedDates);

        socket.on('bookDate', (date) => {
            bookedDates.push(date);
            io.emit('updateDates', bookedDates);

            bookedDatesCollection.insertOne({ date });
        });
    });

    // Rest of your code...


    app.use(express.json());

    app.post('/api/bookDate', (req, res) => {
        const { date } = req.body;

        // Perform necessary validation

        // Save the booked date in MongoDB
        bookedDatesCollection.insertOne({ date }, (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            res.status(200).json({ message: 'Booking successful' });
        });
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});
