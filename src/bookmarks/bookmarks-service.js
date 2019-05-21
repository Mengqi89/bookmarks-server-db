const BookmarksService = {
  getAllBookmarks(knex) {
    return knex.select('*').from("bookmarks");
  },
  getBookmarkById(knex, id) {
    return knex
      .select('*')
      .from('bookmarks')
      .where({ id })
      .first();
  },
  insertBookmark(knex, bookmark) {
    return knex
      .insert(bookmark)
      .into('bookmarks')
      .returning('*')//why do you need to return?
      .then(rows => {
        return rows[0];
      })
  },
  updateBookmark(knex, id, newBookmarkFields) {
    return knex('bookmarks')
      .where({ id })
      .update(newBookmarkFields)
  },
  deleteBookmark(knex, id) {
    return knex('bookmarks')
      .where({ id })
      .delete()
  }
};

module.exports = BookmarksService;
