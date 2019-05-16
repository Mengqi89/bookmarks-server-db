const express = require("express");
const xss = require('xss');
const logger = require("../logger");
const { bookmarks } = require("../store");
const BookmarksService = require("./bookmarks-service");

const bookmarkRouter = express.Router();
const bodyParser = express.json();

const serializeBookmark = bookmark => (
  {
    id: bookmark.id,
    title: xss(bookmark.title),
    description: xss(bookmark.description),
    url: bookmark.url,
    rating: bookmark.rating
  }
)

bookmarkRouter.route("/").get((req, res) => {
  res.send("Hello, boilerplate!");
});

bookmarkRouter
  .route("/bookmarks")
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    BookmarksService.getAllBookmarks(knexInstance)
      .then(bookmarks => {
        res.json(bookmarks.map(serializeBookmark))
      })
      .catch(next);
  })
  .post(bodyParser, (req, res, next) => {
    console.log(req.body);
    const { title, url, description, rating } = req.body;
    const newBookmark = { title, url, description, rating };

    if (!title) {
      logger.error('Title is required');
      return res.status(400).json({ error: { message: "Missing 'title' in request body" } });
    }

    if (!url) {
      logger.error(`Url is required`);
      return res.status(400).json({ error: { message: "Missing 'url' in request body" } });
    }

    // if (!description) {
    //   logger.error(`Description is required`);
    //   return res.status(400).send('Missing title in request body');
    // }

    if (!rating) {
      logger.error(`Rating is required`);
      return res.status(400).json({ error: { message: "Missing 'rating' in request body" } });
    }

    BookmarksService.insertBookmark(req.app.get("db"), newBookmark)
      .then(bookmark => {
        res
          .status(201)
          .location(`/bookmarks/${bookmark.id}`)
          .json(serializeBookmark(bookmark));
      })

      .catch(next);
  });

bookmarkRouter
  .route("/bookmarks/:id")
  .get((req, res, next) => {
    const { id } = req.params;
    // const bookmark = bookmarks.find(c => c.id == id);

    // make sure we found a card
    const knexInstance = req.app.get("db");
    BookmarksService.getBookmarkById(knexInstance, id)
      .then(bookmark => {
        if (!bookmark) {
          logger.error(`Bookmark with id ${id} not found.`);
          return res
            .status(404)
            .json({ error: { message: "Bookmark Not Found" } });
        }
        res.json(serializeBookmark(bookmark));
      })
      .catch(next);
  })
  .delete((req, res) => {
    const { id } = req.params;

    const bookmarkIndex = bookmarks.findIndex(b => b.id == id);

    if (bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res.status(404).send("Not found");
    }

    bookmarks.splice(bookmarkIndex, 1);

    logger.info(`Bookmark with id ${id} deleted.`);
    res.status(204).end();
  });

module.exports = bookmarkRouter;
