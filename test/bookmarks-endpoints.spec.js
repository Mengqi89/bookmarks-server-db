const knex = require("knex");
const app = require("../src/app");
const { makeBookmarksArray, makeMaliciousBookmark } = require('./bookmarks.fixtures')

describe("Bookmarks Endpoints", function () {
  let db;

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DB_URL
    });
    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());

  before("clean the table", () => db("bookmarks").truncate());

  afterEach("cleanup", () => db("bookmarks").truncate());

  describe("GET /api/bookmarks/:bookmarkId", () => {
    context("Given there are not bookmarks", () => {
      it("responds with 404", () => {
        const bookmarkId = 5003;
        return supertest(app)
          .get(`/api/bookmarks/${bookmarkId}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: {
              message: "Bookmark Not Found"
            }
          });
      });
    });
  });

  describe("GET /api/bookmarks", () => {
    context("Given there are not bookmarks", () => {
      it("returns 200 and an empty array", () => {
        return supertest(app)
          .get("/api/bookmarks")
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, []);
      });
    });
    context("Given there are bookmarks", () => {
      const testBookmark = makeBookmarksArray()
      beforeEach("insert bookmarks", () => {
        return db.into("bookmarks").insert(testBookmark);
      });
      it("GET /api/bookmarks responds with 200 and all the bookmarks", () => {
        return supertest(app)
          .get("/api/bookmarks")
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, testBookmark);
      });
    });
  });

  describe("POST /api/bookmarks", () => {
    it("creates a bookmark, responding with 201 and the new bookmark", function () {
      const newBookmark = {
        title: "new title",
        url: "https://www.newtitle.com",
        description: "new description",
        rating: 3
      };
      return supertest(app)
        .post("/api/bookmarks")
        .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
        .send(newBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title);
          expect(res.body.url).to.eql(newBookmark.url);
          expect(res.body.description).to.eql(newBookmark.description);
          expect(res.body.rating).to.eql(newBookmark.rating); //rating does not come back
          console.log(res.body)
          expect(res.body).to.have.property("id");
          expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`);
        })
        .then(res => {
          supertest(app)
            .get(`/api/bookmarks/${res.body.id}`)
            .expect(res.body);
        });
    });

    const requiredFields = ["title", "url", "rating"];

    requiredFields.forEach(field => {
      const newBookmark = {
        title: "Test new article",
        url: "https://www.newbookmark.com",
        rating: 3
      };

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newBookmark[field];

        return supertest(app)
          .post("/api/bookmarks")
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .send(newBookmark)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` }
          });
      });
    });

    it('removes XSS attack content from response', () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark()
      return supertest(app)
        .post('/api/bookmarks')
        .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
        .send(maliciousBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(expectedBookmark.title)
          expect(res.body.description).to.eql(expectedBookmark.description)
        })
    })
  });

  describe.only(`PATCH /api/bookmarks/:bookmarkId`, () => {
    const testBookmark = makeBookmarksArray()

    beforeEach('insert bookmark', () => {
      return db
        .into('bookmarks')
        .insert(testBookmark)
    })

    it('responds with 204 and updates the bookmark', () => {
      const idToUpdate = 3
      const updateBookmark = {
        title: 'updated bookmark',
        url: 'http://updatedbookmark.com',
        description: 'updated description',
        rating: 5
      }
      const expectedBookmark = {
        ...testBookmark[idToUpdate - 1],
        ...updateBookmark
      }
      return supertest(app)
        .patch(`/api/bookmarks/${idToUpdate}`)
        .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
        .send(updateBookmark)
        .expect(204)
        .then(res =>
          supertest(app)
            .get(`/api/bookmarks/${idToUpdate}`)
            .expect(expectedBookmark)
        )
    })
    it('responds with 400 when no required fields supplied', () => {
      const idToUpdate = 3
      return supertest(app)
        .patch(`/api/bookmarks/${idToUpdate}`)
        .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
        .send({ irrevelantField: 'foo' })
        .expect(400, {
          error: {
            message: "Request body must contain either 'title', 'url', 'description' or 'rating'."
          }
        })
    })
    it('responds with 204 when updating only a subset of fields', () => {
      const idToUpdate = 2
      const updateBookmark = {
        title: 'updated bookmark title',
      }
      const expectedBookmark = {
        ...testBookmark[idToUpdate - 1],
        ...updateBookmark
      }

      return supertest(app)
        .patch(`/api/bookmarks/${idToUpdate}`)
        .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
        .send({
          ...updateBookmark,
          fieldToIgnore: 'should not be in GET response'
        })
        .expect(204)
        .then(res =>
          supertest(app)
            .get(`/api/bookmarks/${idToUpdate}`)
            .expect(expectedBookmark)
        )
    })
  })
});
