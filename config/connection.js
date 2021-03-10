var mongoClient =require('mongodb').MongoClient
require('dotenv').config();
const state={
    db:null
}

module.exports.connect=function(done){
    // const url = 'mongodb+srv://bibin:HHaroRxIYKfbECZZ@cluster0.dpvpy.mongodb.net/shopping?retryWrites=true&w=majority'
    const url=process.env.MONGO_URL
    const dbname ='shopping'

    mongoClient.connect(url,{useNewUrlParser:true} ,function(err, data) {
        if(err) {
          return done(err)
        }else{
        state.db=data.db(dbname)
        done()
        }
      });
      
}
module.exports.get=function(){
    return state.db
}