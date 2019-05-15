const BookmarksService = {
  getAllBookmarks(knex) {
    return knex.select("*").from("bookmarks");
  },
  getBookmarkById(knex, id) {
    return knex
      .select("*")
      .from("bookmarks")
      .where({ id })
      .first();
  },
  insertBookmark(knex, bookmark) {
    return knex
      .insert(bookmark)
      .into("bookmarks")
      .returning("*")
      .then(rows => {
        return rows[0];
      });
  }
};

module.exports = BookmarksService;
