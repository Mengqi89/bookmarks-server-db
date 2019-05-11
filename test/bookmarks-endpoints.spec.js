const knex = require('knex')
const app = require('../src/app')

describe('Bookmarks Endpoints', function () {
    let db

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db('bookmarks').truncate())

    afterEach('cleanup', () => db('bookmarks').truncate())

    describe('GET /bookmarks/:bookmarkId', () => {
        context('Given there are not bookmarks', () => {
            it('responds with 404', () => {
                const bookmarkId = 5003;
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                        error: {
                            message: 'Bookmark Not Found'
                        }
                    })
            })
        })
    })

    describe('GET /bookmarks', () => {
        context('Given there are not bookmarks', () => {
            it('returns 200 and an empty array', () => {
                return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, [])
            })
        })
        context('Given there are bookmarks', () => {
            const testBookmarks = [
                {
                    id: 1,
                    title: "facebook",
                    url: "https://www.facebook.com",
                    description: "time waster",
                    rating: 1
                },
                {
                    id: 2,
                    title: "google",
                    url: "https://www.google.com",
                    description: null,
                    rating: 5
                },
                {
                    id: 3,
                    title: "twitter",
                    url: "https://www.twitter.com",
                    description: "idk what it iz",
                    rating: 3
                }
            ];
            beforeEach('insert bookmarks', () => {
                return db.into('bookmarks').insert(testBookmarks)
            })
            it('GET /bookmarks responds with 200 and all the bookmarks', () => {
                return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, testBookmarks)
            })
        })
    })
})