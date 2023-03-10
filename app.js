// The following code contains the express application and routes:

const express = require('express');
const app = express();
const { models: { User, Note }} = require('./db');
const path = require('path');

// This will initialize our environment variables for use in our app. You can now call your secret variable from your code with process.env.JWT
require('dotenv').config()

// middleware
app.use(express.json());

const requireToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    const user = await User.byToken(token);
    req.user = user;
    next();
  } catch(error) {
    next(error);
  }
};

// routes
app.get('/', (req, res)=> res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/auth', async(req, res, next)=> {
  try {
    res.send({ token: await User.authenticate(req.body)});
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/auth', requireToken, async(req, res, next)=> {
  try {
    res.send(req.user);
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/users/:id/notes', requireToken, async(req, res, next)=> {
  try {
    if(req.user){
      res.send( await Note.findAll({
        where : {
          userId : req.user.id
        }
      }));
    }
  }
  catch(ex){
    next(ex);
  }
});

// error handling
app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
