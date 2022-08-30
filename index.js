require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns')
const app = express();
const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose)
const bodyParser = require('body-parser')


const db_uri = process.env['DB_URI']
//conect to db
const connection =mongoose.connect(db_uri, {useNewUrlParser:true, useUnifiedTopology:true,dbName:'Urls'})



//create Schema
const urlSchema = new mongoose.Schema({
  id: Number,
  url: String
})

urlSchema.plugin(AutoIncrement, {inc_field: 'id'})

//create model
let urlModel = mongoose.model('Urls', urlSchema)

// Basic Configuration
const port = process.env.PORT || 3000;

//midlewares
app.use(cors());


app.use('/public', express.static(`${process.cwd()}/public`));
//parse body
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});
const options ={
   family: 6,
  hints: dns.ADDRCONFIG | dns.V4MAPPED,
}

app.post("/api/shorturl/", (req, res) => {
  //check if is a valid url
  let postUrl = req.body.url;
  console.log(postUrl)
  if(postUrl == undefined || postUrl ==""){
    return res.json({error: 'invalid url'}); 
  }
  //remove http for lookup validation
  const regex = /^https?:\/\//i
  let replaceUrl = postUrl.replace(regex, '')

   dns.lookup(replaceUrl, (err, address,family) => {
     
    if(err){
     return res.json({error: 'invalid url'}); 
    }else{

      let newUrl = new urlModel({
      url: postUrl
        })
    newUrl.save( (err) =>{
    let retrieveId
      console.log("saved")
    urlModel.findOne({url:postUrl}, (err,found) =>{
        if(err) return res.send("Hubo un erro")
        retrieveId = found.id
        console.log(retrieveId)
        let jsonUrl = postUrl;
        let jsonKey = retrieveId; res.json({original_url:postUrl,short_url:retrieveId})
      })
     })//save
  
    }//else
  });

})

//redirect
app.get("/api/shorturl/:short_url", (req,res) =>{
 console.log(req.url)
  //get param url
  let requestUrl = req.params.short_url

  //search in Db
  urlModel.findOne({id:requestUrl}, (err,found)=>{
    let redirection = found.url;
    res.redirect(redirection)
  })
  
})


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

//THINGS TO DO
//this project receives urls by a form and stores it with a key, then they show you a json with the url & the key, this is stored somewhere, i suposed that in a database but in a array of objects must work, then when you type /api/shorturl/number, its redirect you to that url, for this I have to made the route, then inside the route I have to get the param and get the json object with that ID & then redirect to its url