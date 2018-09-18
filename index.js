const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const db = require("./database/dbConfig.js");
const session = require('express-session');
//require your library store
const KnexSessionStore = require('connect-session-knex')(session);

const server = express();
const sessionConfig = {
  name: 'monkey', // default is connect.sid
  secret: 'nobody tosses a dwarf!',
  cookie: {
    maxAge: 1 * 24 * 60 * 60 * 1000, // a day
    secure: false, // only set cookies over https. Server will not send back a cookie over http.
  }, // 1 day in milliseconds
  httpOnly: true, // don't let JS code access cookies. Browser extensions run JS code on your browser!
  resave: false,
  saveUninitialized: false,
  store: new KnexSessionStore({
    tablename: 'sessions',
    sidfieldname: 'sid',
    knex: db,
    createtable: true,
    clearInterval: 1000 * 60 * 60,
  }),
};

server.use(session(sessionConfig));

server.use(express.json());
server.use(cors());


server.get("/", (req, res) => {
  res.send("Its Alive!");
});

//guidelines  for auth
server.post("/api/register", (req, res) => {
  //grab credentials
  const creds = req.body;
  //hash the password, 16 is the time it takes and how many times the password is hashed, 2^n, n=16
  const hash = bcrypt.hashSync(creds.password, 16);
  //replace the user password with the hash
  //TlS secure communication between nodes
  //computer > isp > node1 > node 3 > node13 > server

  creds.password = hash;

  //save the user
  db("users")
    .insert(creds)
    .then(ids => {
      const id = ids[0];
      res.status(201).json(id);
    })
    .catch(err => res.status(500).send(err));
  //return 201
});

  server.post("/api/login", (req, res) => {
    //grab the creds
    const creds = req.body;

    //find the user
    db("users")
      .where({ username: creds.username })
      .first()
      .then(user => {
        //check creds
        if(user && bcrypt.compareSync(creds.password, user.password)) {
          res.status(200).send(`Welcome ${req.session.username}`);
        }else{
          res.status(401).json({message:"You shall not pass!"});
        }
      })
      .catch(err => res.status(500).send(err));
    //check the creds
  });

  server.get('/setname', (req, res) => {
    req.session.name = 'Frodo';
    res.send('got it');
  });
  
  server.get('/greet', (req, res) => {
    const name = req.session.name;
    res.send(`hello ${req.session.name}`);
  });


// protect this route, only authenticated users should see it
server.get("/api/users", (req, res) => {
  db("users")
    .select("id", "username", "password")
    .then(users => {
      res.json(users);
    })
    .catch(err => res.send(err));
});

server.listen(3300, () => console.log("\nrunning on port 3300\n"));
