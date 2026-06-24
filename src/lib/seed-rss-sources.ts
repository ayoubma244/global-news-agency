/**
 * Seed RSS Sources - adds RSS feeds from major news sources for all categories.
 * Run this script to populate the database with quality RSS sources.
 */

const RSS_SOURCES = [
  // World News
  { name: 'CNN World', url: 'http://rss.cnn.com/rss/edition_world.rss', siteName: 'CNN', language: 'en', category: 'world-news', autoPublish: true },
  { name: 'BBC World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml', siteName: 'BBC', language: 'en', category: 'world-news', autoPublish: true },
  { name: 'Reuters World', url: 'https://feeds.reuters.com/Reuters/worldNews', siteName: 'Reuters', language: 'en', category: 'world-news', autoPublish: true },
  { name: 'Al Jazeera English', url: 'https://www.aljazeera.com/xml/rss/all.xml', siteName: 'Al Jazeera', language: 'en', category: 'world-news', autoPublish: true },

  // Politics
  { name: 'CNN Politics', url: 'http://rss.cnn.com/rss/edition_politics.rss', siteName: 'CNN', language: 'en', category: 'politics', autoPublish: true },
  { name: 'BBC Politics', url: 'http://feeds.bbci.co.uk/news/politics/rss.xml', siteName: 'BBC', language: 'en', category: 'politics', autoPublish: true },
  { name: 'The Hill', url: 'https://thehill.com/feed/', siteName: 'The Hill', language: 'en', category: 'politics', autoPublish: true },

  // Economy
  { name: 'CNN Business', url: 'http://rss.cnn.com/rss/edition_business.rss', siteName: 'CNN', language: 'en', category: 'economy', autoPublish: true },
  { name: 'BBC Business', url: 'http://feeds.bbci.co.uk/news/business/rss.xml', siteName: 'BBC', language: 'en', category: 'economy', autoPublish: true },
  { name: 'Financial Times', url: 'https://www.ft.com/rss/home', siteName: 'Financial Times', language: 'en', category: 'economy', autoPublish: true },

  // Technology
  { name: 'CNN Tech', url: 'http://rss.cnn.com/rss/edition_technology.rss', siteName: 'CNN', language: 'en', category: 'technology', autoPublish: true },
  { name: 'BBC Tech', url: 'http://feeds.bbci.co.uk/news/technology/rss.xml', siteName: 'BBC', language: 'en', category: 'technology', autoPublish: true },
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', siteName: 'TechCrunch', language: 'en', category: 'technology', autoPublish: true },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', siteName: 'The Verge', language: 'en', category: 'technology', autoPublish: true },

  // Sports
  { name: 'CNN Sport', url: 'http://rss.cnn.com/rss/edition_sport.rss', siteName: 'CNN', language: 'en', category: 'sports', autoPublish: true },
  { name: 'BBC Sport', url: 'http://feeds.bbci.co.uk/sport/rss.xml', siteName: 'BBC Sport', language: 'en', category: 'sports', autoPublish: true },
  { name: 'ESPN', url: 'https://www.espn.com/espn/rss/news', siteName: 'ESPN', language: 'en', category: 'sports', autoPublish: true },

  // Entertainment
  { name: 'CNN Entertainment', url: 'http://rss.cnn.com/rss/edition_entertainment.rss', siteName: 'CNN', language: 'en', category: 'entertainment', autoPublish: true },
  { name: 'BBC Entertainment', url: 'http://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml', siteName: 'BBC', language: 'en', category: 'entertainment', autoPublish: true },
  { name: 'Variety', url: 'https://variety.com/feed/', siteName: 'Variety', language: 'en', category: 'entertainment', autoPublish: true },

  // Health
  { name: 'CNN Health', url: 'http://rss.cnn.com/rss/edition_health.rss', siteName: 'CNN', language: 'en', category: 'health', autoPublish: true },
  { name: 'BBC Health', url: 'http://feeds.bbci.co.uk/news/health/rss.xml', siteName: 'BBC', language: 'en', category: 'health', autoPublish: true },
  { name: 'WebMD', url: 'https://www.webmd.com/rss/news.xml', siteName: 'WebMD', language: 'en', category: 'health', autoPublish: true },

  // Environment
  { name: 'BBC Science/Environment', url: 'http://feeds.bbci.co.uk/news/science_and_environment/rss.xml', siteName: 'BBC', language: 'en', category: 'environment', autoPublish: true },
  { name: 'Guardian Environment', url: 'https://www.theguardian.com/environment/rss', siteName: 'The Guardian', language: 'en', category: 'environment', autoPublish: true },

  // Education
  { name: 'BBC Education', url: 'http://feeds.bbci.co.uk/news/education/rss.xml', siteName: 'BBC', language: 'en', category: 'education', autoPublish: true },
  { name: 'Inside Higher Ed', url: 'https://www.insidehighered.com/rss.xml', siteName: 'Inside Higher Ed', language: 'en', category: 'education', autoPublish: true },

  // Society & Law
  { name: 'BBC UK', url: 'http://feeds.bbci.co.uk/news/uk/rss.xml', siteName: 'BBC', language: 'en', category: 'society-law', autoPublish: true },

  // Travel
  { name: 'CNN Travel', url: 'http://rss.cnn.com/rss/edition_travel.rss', siteName: 'CNN', language: 'en', category: 'travel', autoPublish: true },

  // Religion
  { name: 'BBC Religion', url: 'http://feeds.bbci.co.uk/news/world/asia/india/rss.xml', siteName: 'BBC', language: 'en', category: 'religion', autoPublish: false },

  // Weather
  { name: 'Weather.com National', url: 'https://rss.weather.com/rss/national/rss.xml', siteName: 'Weather.com', language: 'en', category: 'weather', autoPublish: true },

  // Food
  { name: 'BBC Food', url: 'http://feeds.bbci.co.uk/food/recipes/rss.xml', siteName: 'BBC Food', language: 'en', category: 'food', autoPublish: false },

  // Fashion
  { name: 'Vogue Fashion', url: 'https://www.vogue.com/feed/rss', siteName: 'Vogue', language: 'en', category: 'fashion', autoPublish: false },

  // Cars
  { name: 'Top Gear', url: 'https://www.topgear.com/feed', siteName: 'Top Gear', language: 'en', category: 'cars', autoPublish: false },

  // Real Estate
  { name: 'CNN Money Homes', url: 'http://rss.cnn.com/rss/money_news_economy.rss', siteName: 'CNN Money', language: 'en', category: 'real-estate', autoPublish: false },

  // Jobs
  { name: 'BBC Worklife', url: 'http://feeds.bbci.co.uk/news/business/rss.xml', siteName: 'BBC Worklife', language: 'en', category: 'jobs', autoPublish: false },

  // Crypto
  { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', siteName: 'CoinDesk', language: 'en', category: 'crypto', autoPublish: true },
  { name: 'Cointelegraph', url: 'https://cointelegraph.com/rss', siteName: 'Cointelegraph', language: 'en', category: 'crypto', autoPublish: true },

  // Family
  { name: 'BBC Family', url: 'http://feeds.bbci.co.uk/news/world/rss.xml', siteName: 'BBC', language: 'en', category: 'family', autoPublish: false },
]

export default RSS_SOURCES
