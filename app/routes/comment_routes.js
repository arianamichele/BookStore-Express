const express = require('express')
const passport = require('passport')

// pull in Mongoose model for books
const Book = require('../models/book')

const customErrors = require('../../lib/custom_errors')
const handle404 = customErrors.handle404
const requireOwnership = customErrors.requireOwnership
const removeBlanks = require('../../lib/remove_blank_fields')
const requireToken = passport.authenticate('bearer', { session: false })
const router = express.Router()

// ROUTES 


// Create 
// POST /comments/<book_id>
router.post('/comments/:bookId', removeBlanks, (req, res, next) => {
    // get comment from req.body
    const comment = req.body.comment
    // get book's id from req.params.bookId
    const bookId = req.params.bookId
    // find the book
    Book.findById(bookId)
        .then(handle404)
        .then(book => {
            console.log('this is the book', book)
            console.log('this is the comment', comment)

            // push the comment into the book's comments array
            book.comments.push(comment)

            return book.save()

        })
        // send the newly updated book as json
        .then(book => res.status(201).json({ book: book }))
        .catch(next)
})

// UPDATE 
// PATCH /comments/<book_id>/<comment_id>
router.patch('/comments/:bookId/:commentId', requireToken, removeBlanks, (req, res, next) => {

    const bookId = req.params.bookId
    const commentId = req.params.commentId

    // find our book
    Book.findById(bookId)
        .then(handle404)
        .then(book => {
            // single out the comment 
            const theComment = book.comments._id(commentId)
            // make sure the user sending the request is the owner
            requireOwnership(req, book)
            // update the comment with a subdocument method
            theComment.set(req.body.comment)
            // return the saved book
            return book.save()
        })
        .then(() => res.sendStatus(204))
        .catch(next)
})

// DELETE 
// DELETE /comments/<book_id>/<comment_id>
router.delete('/comments/:bookId/:commentId', requireToken, (req, res, next) => {
    // get the comment and the book ids saved to variables
    const bookId = req.params.bookId
    const commentId = req.params.commentId
    // find the book
    Book.findById(bookId)

        .then(handle404)

        .then(book => {

            const theComment = book.comments.id(commentId)
            // user deleting this comment is the book's owner
            requireOwnership(req, book)
            // call remove on the subdoc
            theComment.remove()
            // return the saved book
            return book.save()
        })

        .then(() => res.sendStatus(204))

        .catch(next)
})


module.exports = router