require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const dns = require("dns");
const mongoose = require("mongoose");
const { nanoid } = require("nanoid");
// Basic Configuration
const port = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI);
app.use(cors());
app.use("/public", express.static(`${process.cwd()}/public`));

app.use("/api/shorturl", bodyParser.urlencoded({ extended: false }));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

var url_mapping_registery = [];
const schema = new mongoose.Schema({
  original_url: String,
  short_url: String,
});
const UrlRegistery = mongoose.model("UrlRegistery", schema);
function shortenUrl(url) {
  const short_url = nanoid();
  const url_entry = new UrlRegistery({
    original_url: url,
    short_url,
  });
  url_entry.save().catch((err) => console.log(err));
  return short_url;
}

function getOriginalUrl(short_url, done) {
  return UrlRegistery.findOne({ short_url })
    .then((entry) => done(null, entry.original_url))
    .catch((err) => done(err));
}

function getShortUrl(original_url, done) {
  return UrlRegistery.findOne({ original_url })
    .then((entry) => done(null, entry.short_url))
    .catch((err) => done(err));
}

// Your first API endpoint
app.post("/api/shorturl", function (req, res) {
  const url = req.body.url;
  if (url.match(/^https?:\/\//))
    dns.lookup(url.replace(/^https?[:]\/\//, ""), (err, addr, v) => {
      if (err) return res.json({ error: "invalid url" });
      let short_url;
      function done(err, data) {
        if (err) console.log(err);
        short_url = data;
        console.log("done: ", { short_url });
        res.json({
          original_url: url,
          short_url,
        });
      }
      getShortUrl(url, done);
      if (!short_url) shortenUrl(url, done);
    });
  else return res.json({ error: "invalid url" });
});

app.get("/api/shorturl/:shorturl", (req, res) => {
  if (req.params.shorturl)
    getOriginalUrl(req.params.shorturl, (err, data) => {
      if (err) return console.log(err);
      res.redirect(data);
    });
  else res.redirect("/");
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
