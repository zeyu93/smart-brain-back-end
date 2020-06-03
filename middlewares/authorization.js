const redisClient = require('../controllers/signin').redisClient

const requireAuth = (req,res,next)=>{
  const {authorization} = req.headers;
  if (!authorization) {
    return res.status('401').json('not authorized')
  }
  return redisClient.get(authorization, (err,reply)=>{
    if(err || !reply){
      return res.status('401').json('not authorized')
    }
    return next()
  })
}

module.exports = {
  requireAuth: requireAuth
}