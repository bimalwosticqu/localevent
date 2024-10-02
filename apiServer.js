const express = require('express');
var cors = require('cors');
const app = express();
const port = 3000;

// These lines will be explained in detail later in the unit
app.use(express.json());// process json
app.use(express.urlencoded({ extended: true }));
app.use(cors());
const path = require('path'); // Import the path module
// These lines will be explained in detail later in the unit

const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://giftadmin:admin@cluster0.5fdfa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const options = {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	ssl: true
};
const client = new MongoClient(uri, options);
// Global for general use
var userCollection;
var eventCollection;
var notificationCollection;
var newsCollection;

client.connect(err => {
	userCollection = client.db("localeventfinderapp").collection("users");
	eventCollection = client.db("localeventfinderapp").collection("events");
	notificationCollection = client.db("localeventfinderapp").collection("notifications");
	newsCollection = client.db("localeventfinderapp").collection("news");


	// perform actions on the collection object
	console.log('Database up!\n')

});

let isAuthenticated = false;

// Middleware to check authentication status
function checkAuthentication(req, res, next) {
	if (isAuthenticated) {
		return next();
	} else {
		res.status(403).send('Access denied. Please log in.');
	}
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', checkAuthentication, (req, res) => {
	res.sendFile(path.join(__dirname, 'dashboard.html'));
});


// Serve events.html
app.get('/events', checkAuthentication, (req, res) => {
	res.sendFile(path.join(__dirname, 'events/index.html'));
});

// Serve news.html
app.get('/news', checkAuthentication, (req, res) => {
	res.sendFile(path.join(__dirname, 'news/index.html'));
});


// Serve events.html
app.get('/events/create', checkAuthentication, (req, res) => {
	res.sendFile(path.join(__dirname, 'events/create.html'));
});

// Serve news.html
app.get('/news/create', checkAuthentication, (req, res) => {
	res.sendFile(path.join(__dirname, 'news/create.html'));
});



app.get('/getUserDataTest', (req, res) => {

	console.log("GET request received\n for testing user data");

	userCollection.find({}, { projection: { _id: 0 } }).toArray(function (err, docs) {
		if (err) {
			console.log("Some error.. " + err + "\n");
			res.send(err);
		} else {
			console.log(JSON.stringify(docs) + " have been retrieved.\n");
			res.status(200).send("<h1>" + JSON.stringify(docs) + "</h1>");
		}

	});

});

app.post('/checkEmail', (req, res) => {
	console.log("POST request received for checking if email exists: " + JSON.stringify(req.body) + "\n");
	userCollection.findOne({ email: req.body.email }, (err, user) => {
		if (err) {
			console.error("Error checking email: ", err);
			res.status(500).send("Error checking email");
		} else {
			res.status(200).json({ exists: !!user });
		}
	});
});


app.post('/verifyUser', (req, res) => {
	console.log("POST request received for logging in: " + JSON.stringify(req.body) + "\n");
	loginData = req.body;
	userCollection.findOne({ email: loginData.email, password: loginData.password }, (err, docs) => {
		if (err) {
			console.log("Some error.. " + err + "\n");
			res.send(err);
		} else {
			if (docs && docs.email === 'admin@event.com' && docs.password === 'admin') {
				isAuthenticated = true; // Set the global variable to true when logged in
				console.log(JSON.stringify(docs) + " have been retrieved.\n");
				res.status(200).send(docs);
			} else {
				console.log(JSON.stringify(docs) + " have been retrieved.\n");
				res.status(200).send(docs);
			}
		}
	});
});

app.post('/signup', (req, res) => {
	console.log("POST request received for sign up data : " + JSON.stringify(req.body) + "\n");
	registerData = req.body;
	userCollection.insertOne(registerData, (err, result) => {
		if (err) {
			console.error("Error inserting new user: ", err);
			res.status(500).send("Error inserting new user");
		} else {
			console.log("New user inserted with ID: ", result.insertedId);
			res.status(201).json({ message: 'User created successfully', userId: result.insertedId });
		}
	});

});

app.get('/getEvents', (req, res) => {
	console.log("Get request received for events: " + JSON.stringify(req.query) + "\n");
	searchType = req.query.type;
	searchText = req.query.searchText;

	if (searchType == 'all') {
		console.log('i am here');
		eventCollection.find({}, { projection: { _id: 0 } }).sort({ eventDate: -1 }).toArray(function (err, events) {
			if (err) {
				console.error("Error fetching events: ", err);
				res.status(500).send("error fetching events");
			} else {
				res.status(200).json({ data: events });
			}
		});
	}

	if (searchType == 'date') {
		eventCollection.find({ eventDate: searchText }, { projection: { _id: 0 } }).sort({ eventDate: -1 }).toArray(function (err, events) {
			if (err) {
				console.error("Error fetching events: ", err);
				res.status(500).send("error fetching events");
			} else {
				res.status(200).json({ data: events });
			}
		});
	}

	if (searchType == 'location') {
		eventCollection.find({ eventLocation: searchText }, { projection: { _id: 0 } }).sort({ eventDate: -1 }).toArray(function (err, events) {
			if (err) {
				console.error("Error fetching events: ", err);
				res.status(500).send("error fetching events");
			} else {
				res.status(200).json({ data: events });
			}
		});
	}

	if (searchType == 'price') {
		eventCollection.find({ eventPrice: searchText }, { projection: { _id: 0 } }).sort({ eventDate: -1 }).toArray(function (err, events) {
			if (err) {
				console.error("Error fetching events: ", err);
				res.status(500).send("error fetching events");
			} else {
				res.status(200).json({ data: events });
			}
		});
	}
});

app.get('/getNews', (req, res) => {
	console.log("Get request received for news: " + JSON.stringify(req.query) + "\n");
	newsCollection.find().sort({ newsDate: -1 }).toArray(function (err, news) {
		if (err) {
			console.error("Error fetching news: ", err);
			res.status(500).send("error fetching news");
		} else {
			res.status(200).json({ data: news });
		}
	});
});



// Handle event form submission
// Add a new event
app.post('/add-event', (req, res) => {
	const { title, type, description, date, time, location, price, image } = req.body;

	const newEvent = {
		eventName: title,
		eventType: type,
		eventDescription: description,
		eventDate: date,
		eventTime: time,
		eventLocation: location,
		eventPrice: price,
		eventImage: image
	};

	eventCollection.insertOne(newEvent)
		.then(() => {

			// Create a notification message
			const notificationMessage = `New event "${newEvent.eventName}" has been added!`;
			const notificationData = {
				message: notificationMessage,
				timestamp: new Date(),
				type: 'events',
				image: newEvent.eventImage
			};

			notificationCollection.insertOne(notificationData).then(() => {
				console.log('Notification created successfully!');
			})
				.catch(error => {
					console.error('Error creating notification:', error);
				});

			// Call the notifications API to save the notification

			res.status(201).send('Event added successfully!');
		})
		.catch(err => {
			res.status(400).send('Error saving event: ' + err);
		});
});



// Handle news form submission

// Add news form submission route
app.post('/add-news', (req, res) => {
	const { title, description, date, image, status } = req.body; // Ensure these fields match what is sent from the front-end

	const newNews = {
		newsTitle: title,  // Using correct keys for MongoDB document
		newsContent: description,
		newsDate: date,
		newsImage: image,
		newsStatus: status
	};

	// Insert new news into the MongoDB collection
	newsCollection.insertOne(newNews)
		.then(() => {

			// Create a notification message
			const notificationMessage = `New news "${newNews.newsTitle}" has been added!`;
			const notificationData = {
				message: notificationMessage,
				timestamp: new Date(),
				type: 'news',
				image: newNews.newsImage
			};

			notificationCollection.insertOne(notificationData).then(() => {
				console.log('Notification created successfully!');
			})
				.catch(error => {
					console.error('Error creating notification:', error);
				});;

			res.status(201).send('News added successfully!');
		})
		.catch(err => {
			res.status(400).send('Error saving news: ' + err);
		});
});

// 

// Delete event by ID
// Delete event by ID
app.delete('/events/delete/:id', (req, res) => {
	const eventId = req.params.id;

	// Ensure the ID is correctly converted to ObjectId
	eventCollection.deleteOne({ _id: new ObjectId(eventId) })
		.then(result => {
			if (result.deletedCount === 1) {
				res.status(200).send('Event deleted successfully');
			} else {
				res.status(404).send('Event not found');
			}
		})
		.catch(err => {
			res.status(500).send('Error deleting event: ' + err);
		});
});


// Delete news by ID
app.delete('/news/delete/:id', (req, res) => {
	const newsId = req.params.id;

	// Ensure the ID is correctly converted to ObjectId
	newsCollection.deleteOne({ _id: new ObjectId(newsId) })
		.then(result => {
			if (result.deletedCount === 1) {
				res.status(200).send('News deleted successfully');
			} else {
				res.status(404).send('News not found');
			}
		})
		.catch(err => {
			res.status(500).send('Error deleting news: ' + err);
		});
});


// Endpoint to get counts for events and news
app.get('/dashboard-stats', (req, res) => {
	const eventCountPromise = eventCollection.countDocuments(); // Count documents in the events collection
	const newsCountPromise = newsCollection.countDocuments();   // Count documents in the news collection

	// Execute both promises and send the result back to the client
	Promise.all([eventCountPromise, newsCountPromise])
		.then(([eventCount, newsCount]) => {
			res.json({ eventCount, newsCount });
		})
		.catch(err => {
			res.status(500).send('Error fetching dashboard statistics');
		});
});

app.get('/getNotifications', (req, res) => {
	console.log("Get request received for notifications: " + JSON.stringify(req.query) + "\n");
	notificationCollection.find().sort({ timestamp: -1 }).toArray(function (err, notification) {
		if (err) {
			console.error("Error fetching notifications: ", err);
			res.status(500).send("error fetching notifications");
		} else {
			res.status(200).json({ data: notification });
		}
	});
});

// // Handle login (for demo purposes, username/password are hardcoded)
// app.post('/admin-login', (req, res) => {
// 	const { email, password } = req.body;

// 	// Simple hardcoded login check
// 	if (username === 'admin@event.com' && password === 'admin') {
// 		isAuthenticated = true; // Set the global variable to true when logged in
// 		res.redirect('/dashboard');
// 	} else {
// 		res.send('Invalid username or password');
// 	}
// });

app.listen(port, () => {
	console.log(`Local event finder server app listening at http://localhost:${port}`)
});
