const express = require('express');
const FeedParser = require('feedparser');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res) => {
  const feedUrl = 'https://www.iacr.org/news/rss';
  
  try {
    const response = await axios.get(feedUrl, {
      responseType: 'stream'
    });

    if (response.status !== 200) {
      throw new Error(`Bad status code: ${response.status}`);
    }

    const feedparser = new FeedParser();
    const newsItems = [];

    response.data.pipe(feedparser);

    feedparser.on('error', error => {
      console.error('Error parsing feed:', error);
      throw error;
    });

    feedparser.on('readable', function() {
      let item;
      while (item = this.read()) {
        newsItems.push({
          title: item.title,
          link: item.link,
          published: item.pubDate,
          summary: item.description,
          author: item.author,
          categories: item.categories
        });
      }
    });

    await new Promise((resolve, reject) => {
      feedparser.on('end', () => {
        res.json(newsItems);
        resolve();
      });
      feedparser.on('error', reject);
    });
  } catch (error) {
    console.error('Error fetching IACR news:', error);
    res.status(500).json({ error: 'Failed to fetch IACR news feed' });
  }
});

module.exports = router;

module.exports = router;