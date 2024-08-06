const express = require('express');
const urlRoute = require('./routes/url');
const path = require('path');
const staticRoutes = require('./routes/staticRouter');
const { connectToMongoDb } = require('./connect');
const URL = require('./models/url');
const app = express();
const PORT = 8002;

app.set('view engine', 'ejs');
app.set('views', path.resolve('./views'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/', staticRoutes);

connectToMongoDb('mongodb://127.0.0.1:27017/urlshortner')
  .then(() => console.log('mongodb connected'))
  .catch((err) =>
    console.log('There was an error while connecting to mongodb', err)
  );

app.use('/url', urlRoute);

app.get('/url/:shortId', async (req, res) => {
  try {
    const shortId = req.params.shortId;
    const entry = await URL.findOneAndUpdate(
      { shortId },
      { $push: { visitHistory: { timestamp: Date.now() } } },
      { new: true } // Ensures the updated document is returned
    );

    if (!entry) {
      return res.status(404).json({ error: 'URL not found' });
    }

    res.redirect(entry.redirectURL);
  } catch (err) {
    console.error('Error while processing request:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => console.log(`server started at PORT ${PORT}`));
