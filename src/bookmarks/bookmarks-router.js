const express = require('express');
const xss = require('xss');
const logger = require('../logger');
const { bookmarks } = require('../store');
const BookmarksService = require('./bookmarks-service');

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
bookmarkRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
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
      return res.status(400).json({ error: { message: `Missing 'title' in request body` } });
    }
    if (!url) {
      logger.error(`Url is required`);
      return res.status(400).json({ error: { message: `Missing 'url' in request body` } });
    }
    if (!rating) {
      logger.error(`Rating is required`);
      return res.status(400).json({ error: { message: `Missing 'rating' in request body` } });
    }

    BookmarksService.insertBookmark(req.app.get('db'), newBookmark)
      .then(bookmark => {
        res
          .status(201)
          .location(`/api/bookmarks/${bookmark.id}`)
          .json(serializeBookmark(bookmark));
      })
      .catch(next);
  });

bookmarkRouter
  .route('/:bookmarkId')
  .all((req, res, next) => {
    const { bookmarkId } = req.params;
    const knexInstance = req.app.get('db');
    BookmarksService
      .getBookmarkById(knexInstance, bookmarkId)
      .then(bookmark => {
        if (!bookmark) {
          // logger.error(`Bookmark with id ${bookmarkId} not found.`);
          return res
            .status(404)
            .json({ error: { message: 'Bookmark Not Found' } });
        }
        res.bookmark = bookmark
        next()
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(serializeBookmark(res.bookmark))
  })
  .delete((req, res) => {

    const bookmarkIndex = bookmarks.findIndex(b => b.id == id);

    if (bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${bookmarkId} not found.`);
      return res.status(404).send('Not found');
    }

    bookmarks.splice(bookmarkIndex, 1);

    logger.info(`Bookmark with id ${bookmarkId} deleted.`);
    res.status(204).end();
  })
  .patch(bodyParser, (req, res, next) => {
    const { title, url, description, rating } = req.body
    const bookmarkToUpdate = { title, url, description, rating }
    console.log(bookmarkToUpdate)
    const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length
    if (numberOfValues === 0) {
      return res
        .status(400)
        .json({
          error: {
            message: `Request body must contain either 'title', 'url', 'description' or 'rating'.`
          }
        })
    }
    BookmarksService.updateBookmark(
      req.app.get('db'),
      bookmarkId,
      bookmarkToUpdate
    )
      .then(numRowsAffected => {
        res
          .status(204)
          .end()
      })
      .catch(next)
  })

module.exports = bookmarkRouter;
