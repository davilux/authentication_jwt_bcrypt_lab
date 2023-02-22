// The following code contains the Sequelize data models and database seeding code:

const jwt = require('jsonwebtoken')
require('dotenv').config()
const SECRET_KEY = process.env.JWT

const bcrypt = require('bcrypt')

const Sequelize = require('sequelize');
const { STRING, TEXT } = Sequelize;
const config = {
  logging: false
};

if(process.env.LOGGING){
  delete config.logging;
}
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_db', config);

/**
 *  -------------- USER MODEL --------------
 */

const User = conn.define('user', {
  username: STRING,
  password: STRING
});

User.byToken = async(token)=> {
  try {
    const {userId} = jwt.verify(token, SECRET_KEY)
    const user = await User.findByPk(userId);
    if(user){
      return user;
    }
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
  catch(ex){
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
};

User.authenticate = async({ username, password })=> {
  const user = await User.findOne({
    where: {
      username
    }
  });
  if(user && await bcrypt.compare(password, user.password)){
    const userId = user.id
    const token = jwt.sign({userId}, SECRET_KEY);
    return token
  }
  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

User.beforeCreate(async(user)=>{
  if(user.changed('password')){
    user.password = await bcrypt.hash(user.password, 3);
  }
})

/**
 *  -------------- NOTE MODEL --------------
 */
const Note = conn.define('note', {
  text : TEXT
})


/**
 *  -------------- ASSOCIATIONS --------------
 */

Note.belongsTo(User)
User.hasMany(Note)

/**
 *  -------------- SEED --------------
 */

const syncAndSeed = async()=> {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw'},
    { username: 'moe', password: 'moe_pw'},
    { username: 'larry', password: 'larry_pw'}
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map( credential => User.create(credential))
  );

  const notes = [
    { text: 'hello world'},
    { text: 'reminder to buy groceries'},
    { text: 'reminder to do laundry'}
  ];
  const [note1, note2, note3] = await Promise.all(notes.map(
     note => Note.create(note)));
      await lucy.setNotes(note1);
      await moe.setNotes([note2, note3]
  );

  return {
    users: {
      lucy,
      moe,
      larry
    }
  };
};

/**
 *  -------------- EXPORTS --------------
 */

module.exports = {
  syncAndSeed,
  models: {
    User,
    Note
  }
};
