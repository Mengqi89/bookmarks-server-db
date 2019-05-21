module.exports = {
  PORT: process.env.PORT || 8000, // feeds into server.js
  NODE_ENV: process.env.NODE_ENV || 'development', //feeds into app.js
  DB_URL: process.env.DB_URL || 'postgresql://dunder-mifflin:password@localhost/bookmarks'
}