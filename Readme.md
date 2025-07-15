#  Event Management REST API

A simple REST API to manage events and user registrations using *Node.js, **Express, and **PostgreSQL*.

This project allows you to:
- Create events
- Register users to events
- Cancel registrations
- View event details, stats, and upcoming events

---

##  Setup Instructions

### 1. Clone the repository
bash
git clone https://github.com/Sahillutade/Event-Management-API.git
cd Event-Management-API


### 2. Install dependencies
bash
npm install


### 3. Configure environment variables
Create a .env file in the root folder:


DATABASE_URL=postgresql://username:password@localhost:5432/yourdbname


### 4. Create tables in PostgreSQL

sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  datetime TIMESTAMP NOT NULL,
  location TEXT NOT NULL,
  capacity INT CHECK (capacity > 0 AND capacity <= 1000)
);

CREATE TABLE registrations (
  user_id UUID REFERENCES users(id),
  event_id UUID REFERENCES events(id),
  PRIMARY KEY (user_id, event_id)
);


### 5. Start the server
bash
node index.js


Server will run at:  

http://localhost:3000


---

##  API Endpoints

###  POST /events — Create Event
Creates a new event.

####  Request Body
json
{
  "title": "Tech Talk",
  "datetime": "2025-07-20T10:00:00Z",
  "location": "Pune",
  "capacity": 200
}


####  Response
json
{
  "eventId": "f1c24e2b-0d52-4b7c-bcad-4c0d259cbe32"
}


---

###  GET /events/:id — Event Details
Returns event data and registered users.

####  Response
json
{
  "event": {
    "id": "event-id",
    "title": "Tech Talk",
    "datetime": "2025-07-20T10:00:00Z",
    "location": "Pune",
    "capacity": 200
  },
  "registeredUsers": [
    {
      "id": "user-id",
      "name": "Alice",
      "email": "alice@example.com"
    }
  ]
}


---

###  POST /events/:id/register — Register User
Registers a user to an event.

####  Request Body
json
{
  "userId": "user-id"
}


####  Response
json
{
  "message": "Registered successfully"
}


####  Possible Errors
- Already registered
- Event is full
- Event has already occurred

---

###  DELETE /events/:id/cancel — Cancel Registration

####  Request Body
json
{
  "userId": "user-id"
}


####  Response
json
{
  "message": "Registration cancelled"
}


####  Possible Error
json
{
  "message": "User not registered for this event"
}


---

###  GET /events/upcoming — Upcoming Events

####  Response
json
[
  {
    "id": "event-id",
    "title": "Tech Talk",
    "datetime": "2025-07-20T10:00:00Z",
    "location": "Pune",
    "capacity": 200
  }
]


Sorted by date (ascending) and then location (alphabetically).

---

###  GET /events/:id/stats — Event Stats

####  Response
json
{
  "totalRegistrations": 45,
  "remainingCapacity": 155,
  "percentageUsed": "22.50%"
}


---

## 🧠 Business Rules Implemented
- Max capacity: 1000
- No duplicate registrations
- No registrations for past events
- Accurate event stats
- Proper HTTP error codes

