const express = require('express');
const cors = require('cors');
const pool = require('./db');

// Create connection string

const app = express();
app.use(cors());
app.use(express.urlencoded({extended:true}));
app.use(express.json());

// Create API endpoints

// Add new events

app.post('/events', async (req, res) => {
    const {title, datetime, location, capacity} = req.body;
    if(!title || !datetime || !location || capacity <= 0 || capacity > 1000){       // Validating the event data.
        return res.status(400).json({ message: "Invalid data" });
    }

    try {
        const result = await pool.query('INSERT INTO public.events (title, datetime, location, capacity) VALUES ($1, $2, $3, $4) RETURNING id',[title, datetime, location, capacity]);
        res.status(201).json({ eventId: result.rows[0].id });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// User and Event details

app.get('/events/:id', async (req, res) => {
    try{
        const event = await pool.query('SELECT * FROM public.events WHERE id = $1',[req.params.id]);     // Retrieving the specific event details 
        const users = await pool.query('SELECT u.id, u.name, u.email FROM public.registrations r JOIN public.users u ON r.user_id = u.id WHERE r.event_id = $1',[req.params.id]);   // Retrieving the User Registered data from the selected event 
        res.json({ event: event.rows[0], registeredUsers: users.rows });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Event Register

app.post('/events/:id/register', async (req, res) => {
    const { userId } = req.body;
    const eventId = req.params.id;

    try {
        const event = await pool.query('SELECT * FROM public.events WHERE id = $1',[eventId]);
        if(!event.rows.length || new Date(event.rows[0].datetime) < new Date()) {              // Checking the whether event occured or not found
            return res.status(400).json({ message: 'Event not found or already occured' });
        }

        const regCount = await pool.query('SELECT COUNT(*) FROM public.registrations WHERE event_id = $1',[eventId]);
        if(parseInt(regCount.rows[0].count) >= event.rows[0].capacity) {                                            // Checking whether the event booking is full or not
            return res.status(400).json({ message: 'Event is full' });
        }

        const exists = await pool.query('SELECT * FROM public.registrations WHERE user_id = $1 AND event_id = $2',[userId, eventId]);        // Checking whether the user is already registered or new register
        if(exists.rows.length) {
            return res.status(400).json({ message: 'Already registered' });
        }

        await pool.query('INSERT INTO public.registrations (user_id, event_id) VALUES ($1, $2)',[userId, eventId]);           // Registering the user for an event 
        res.json({ message: 'Registered successfully' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Cancel registration

app.delete('/events/:id/cancel', async (req, res) => {
    const { userId } = req.body;

    try {
        const result = await pool.query('DELETE FROM public.registrations WHERE user_id = $1 AND event_id = $2 RETURNING *',[userId, req.params.id]);          // Checking whether the user had registered for the event before cancelling 
        if(!result.rowCount){
            return res.status(404).json({ message: 'User not registered for this event' });
        }
        res.json({ message: 'Registration Cancelled' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upcoming Events

app.get('/events/upcoming', async (req, res) => {
    try{
        const result = await pool.query('SELECT * FROM public.events WHERE datetime > NOW() ORDER BY datetime ASC, location ASC');           // Retrieving the events which are upcoming 
        res.json(result.rows);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Event Stats

app.get('/events/:id/stats', async (req, res) => {
    try{
        const event = await pool.query('SELECT capacity FROM public.events WHERE id = $1',[req.params.id]);        // Checking the capacity of the event
        if(!event.rows.length){
            return res.status(404).json({ message: 'Event not found' });
        }
        const registered = await pool.query('SELECT COUNT(*) FROM public.registrations WHERE event_id = $1',[req.params.id]);
        const total = parseInt(registered.rows[0].count);                           // Total number of user registered for the event
        const capacity = event.rows[0].capacity;

        res.json({
            totalRegistrations: total,         
            remainingCapacity: capacity - total,                   // Calculating remaining seats for the event
            percentageUsed: ((total / capacity) * 100).toFixed(2) + '%'      // Calculating the percent of users registered for event
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000);
console.log(`server stared at http://127.0.0.1:3000`);