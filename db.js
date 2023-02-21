// The following code contains the Sequelize data models and database seeding code:

const jwt = require('jsonwebtoken')
require('dotenv').config()
const SECRET_KEY = process.env.JWT

const Sequelize = require('sequelize');
const { STRING } = Sequelize;
const config = {
  logging: false
};

if(process.env.LOGGING){
  delete config.logging;
}
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_db', config);

const User = conn.define('user', {
  username: STRING,
  password: STRING
});

User.byToken = async(token)=> {
  try {
    console.log('byToken')
    console.log(token)

    const {userId} = jwt.verify(token, SECRET_KEY)
    console.log(userId)
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
  console.log('authenticate')
  const user = await User.findOne({
    where: {
      username,
      password
    }
  });
  console.log(user.id)
  if(user){
    const userId = user.id
    const token = jwt.sign({userId}, SECRET_KEY);
    console.log(token)
    return token
  }
  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

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
  return {
    users: {
      lucy,
      moe,
      larry
    }
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User
  }
};
