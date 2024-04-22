require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const dns= require("dns")
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use('/api/shorturl',bodyParser.urlencoded({extended:false}))

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

var url_mapping_registery = [];

function shortenUrl(url) {
  const short_url=url_mapping_registery.length
  url_mapping_registery.push({
    original_url:url,
    short_url
  })
  return short_url
}
// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  const url = req.body.url;
  if (url.match(/^https?:\/\//))
    dns.lookup(url.replace(/^https?[:]\/\//, ""), (err, addr, v) => {
      if (err) return res.json({ error: "invalid url" });
      res.json({
        original_url: url,
        short_url: getOriginalUrl(url) ?? shortenUrl(url),
      });
    });
  else return res.json({ error: "invalid url" });
});

function getOriginalUrl(short_url) {
  return url_mapping_registery.find(v=>v.short_url==parseInt(short_url))?.original_url
}

app.get('/api/shorturl/:shorturl',(req,res)=>{
  if (req.params.shorturl) res.redirect(getOriginalUrl(req.params.shorturl));
  else res.redirect("/");
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
