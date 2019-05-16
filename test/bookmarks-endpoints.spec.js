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

  describe("GET /bookmarks/:bookmarkId", () => {
    context("Given there are not bookmarks", () => {
      it("responds with 404", () => {
        const bookmarkId = 5003;
        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: {
              message: "Bookmark Not Found"
            }
          });
      });
    });
  });

  describe("GET /bookmarks", () => {
    context("Given there are not bookmarks", () => {
      it("returns 200 and an empty array", () => {
        return supertest(app)
          .get("/bookmarks")
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, []);
      });
    });
    context("Given there are bookmarks", () => {
      beforeEach("insert bookmarks", () => {
        return db.into("bookmarks").insert(makeBookmarksArray());
      });
      it("GET /bookmarks responds with 200 and all the bookmarks", () => {
        return supertest(app)
          .get("/bookmarks")
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, makeBookmarksArray());
      });
    });
  });
  describe.only("POST /bookmarks", () => {
    it("creates a bookmark, responding with 201 and the new bookmark", function () {
      const newBookmark = {
        title: "new title",
        url: "https://www.newtitle.com",
        description: "new description",
        rating: 3
      };
      return supertest(app)
        .post("/bookmarks")
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
          expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`);
        })
        .then(res => {
          supertest(app)
            .get(`/bookmarks/${res.body.id}`)
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
          .post("/bookmarks")
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
        .post('/bookmarks')
        .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
        .send(maliciousBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(expectedBookmark.title)
          expect(res.body.description).to.eql(expectedBookmark.description)
        })
    })
  });
});
