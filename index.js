const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const db = require("./database/dbConfig.js");

const server = express();

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
          res.status(200).send('Welcome');
        }else{
          res.status(401).json({message:"You shall not pass!"});
        }
      })
      .catch(err => res.status(500).send(err));
    //check the creds
  });

// server.post("/api/login", (req, res) => {
//   // grab credentials
//   const creds = req.body;

//   // find the user
//   db("users")
//     .where({ username: creds.username })
//     .first()
//     .then(user => {
//       if (user && bcrypt.compareSync(creds.password, user.password)) {
//         res.status(200).send('Welcome');
//       } else {
//         res.status(401).json({ Error: "Cannot Authorize" });
//       }
//     })
//     .catch(err => {
//       console.log(err);
//       res.status(500).json({ Error: "Login Failed" });
//     });
// });


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
