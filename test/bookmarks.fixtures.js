function makeBookmarksArray() {
    return [
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
    ]
}

function makeMaliciousBookmark() {
    const maliciousBookmark = {
        id: 911,
        title: 'Naughty naughty very naughty <script>alert("xss");</script>',
        url: 'https://www.naughty911.com',
        description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        rating: 3
    }

    const expectedBookmark = {
        ...maliciousBookmark,
        title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
    }

    return {
        maliciousBookmark,
        expectedBookmark
    }

}

module.exports = {
    makeBookmarksArray,
    makeMaliciousBookmark
}