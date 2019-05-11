const express = require('express')
const uuid = require('uuid/v4')
const logger = require('../logger')
const { bookmarks } = require('../store')
const BookmarksService = require('./bookmarks-service')

const bookmarkRouter = express.Router()
const bodyParser = express.json()

bookmarkRouter
    .route('/')
    .get((req, res) => {
        res.send('Hello, boilerplate!')
    })

bookmarkRouter
    .route('/bookmarks')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        BookmarksService.getAllBookmarks(knexInstance)
            .then(bookmarks => res.json(bookmarks))
            .catch(next);
    })
    .post(bodyParser, (req, res) => {
        console.log(req.body)
        const { title, url, description, rating } = req.body;

        if (!title) {
            logger.error(`Title is required`);
            return res
                .status(400)
                .send('Invalid data 1');
        }

        if (!url) {
            logger.error(`Url is required`);
            return res
                .status(400)
                .send('Invalid data 2');
        }

        if (!description) {
            logger.error(`Description is required`);
            return res
                .status(400)
                .send('Invalid data 3');
        }

        if (!rating) {
            logger.error(`Rating is required`);
            return res
                .status(400)
                .send('Invalid data 4');
        }

        const id = uuid();

        const bookmark = {
            id,
            title,
            url,
            description,
            rating
        };

        bookmarks.push(bookmark);

        logger.info(`Bookmark with id ${id} created`);

        res
            .status(201)
            .location(`http://localhost:8000/bookmark/${id}`)
            .json(bookmark);
    })

bookmarkRouter
    .route('/bookmarks/:id')
    .get((req, res, next) => {
        const { id } = req.params;
        // const bookmark = bookmarks.find(c => c.id == id);

        // make sure we found a card
        const knexInstance = req.app.get('db')
        BookmarksService.getBookmarkById(knexInstance, id)
            .then(bookmark => {
                if (!bookmark) {
                    logger.error(`Bookmark with id ${id} not found.`);
                    return res
                        .status(404)
                        .json({ error: { message: 'Bookmark Not Found' } });
                }
                res.json(bookmark)
            })
            .catch(next);
    })
    .delete((req, res) => {
        const { id } = req.params;

        const bookmarkIndex = bookmarks.findIndex(b => b.id == id);

        if (bookmarkIndex === -1) {
            logger.error(`Bookmark with id ${id} not found.`);
            return res
                .status(404)
                .send('Not found');
        }

        bookmarks.splice(bookmarkIndex, 1);

        logger.info(`Bookmark with id ${id} deleted.`);

        res
            .status(204)
            .end();
    })


module.exports = bookmarkRouter