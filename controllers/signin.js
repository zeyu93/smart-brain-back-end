const jwt = require("jsonwebtoken");
const redis = require("redis");
const redisClient = redis.createClient(process.env.REDIS_URI);

const handleSignin = (db, bcrypt, req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return Promise.reject("incorrect form submission");
  }
  return db
    .select("email", "hash")
    .from("login")
    .where("email", "=", email)
    .then(data => {
      const isValid = bcrypt.compareSync(password, data[0].hash);
      if (isValid) {
        return db
          .select("*")
          .from("users")
          .where("email", "=", email)
          .then(user => {
            return user[0];
          })
          .catch(err => Promise.reject("unable to get user"));
      } else {
        Promise.reject("wrong credentials");
      }
    })
    .catch(err => Promise.reject("wrong credentials"));
};

const signToken = email => {
  const jwtPayload = { email };
  const token = jwt.sign(jwtPayload, process.env.JWT_SECRET);
  return token;
};

const setToken = (id, token) => {
  return new Promise((resolve, reject) => {
      resolve(redisClient.set(token, id));
  });
};

const createSessions = user => {
  const { id, email } = user;
  const token = signToken(email);

  return setToken(id, token)
    .then(() => {
      return { sucess: true, userId: id, token };
    })
    .catch(err => console.log(err));
};

const handleAuth = (db, bcrypt) => (req, res) => {
  const { authorization } = req.headers;
  return authorization
    ? getAuthToken()
    : handleSignin(db, bcrypt, req, res)
        .then(data => {
          return data.id && data.email
            ? createSessions(data)
            : Promise.reject("no bueno");
        })
        .then(session => res.json(session))
        .catch(err => res.status(400).json(err));
};

module.exports = {
  handleAuth: handleAuth
};
