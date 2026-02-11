import Book from "../models/book.model.js" 
import Author from "../models/author.model.js"

// Create a book 

export const createBook = async (req, res) =>{
  try {
    const { title, publishedYear, description, authorId } = req.body;

    const authorExists = await Author.findById(authorId);
    if(!authorExists) return res.status(404).json({ message: "Author not found"});

    const newBook = await Book.create({ title, publishedYear, description, coverImage: req.file.path, author:authorId});
    console.log(newBook);
    res.status(201).json({
      success: true,
      data: newBook
    });
  }catch(error){
    res.status(500).json({ message: error.message});
  }
};

// Get all book

export const getBook = async (req, res) => {
  try{
    const books = await Book.find({ status: true}).populate("author", "name bio");
    res.json({
      success: true,
      data: books
    });
  }catch(error){
    res.status(500).json({
      message: error.message
    });
  }
};

// Get single book 

export const getSingleBook = async (req, res) =>{
  try{
    const book = await Book.findOne({ _id: req.params.id, status: true}).populate("author");
    res.json(book);
  }catch(error){
    res.status(500).json({
      message: error.message
    });
  }
};

// update 

export const updateBooks = async (req, res) => {
  try{
    const updateBook = await Book.findByIdAndUpdate({ _id: req.params.id, status: true},  req.body, { new: true});
    if(!updateBook) {
      return res.status(404).json({
        message: "Book not found"
      });
    }

    res.json({
      success: true,
      data: updateBook
    })
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// delete (soft)

export const deleteBook = async (req, res) => {
  try{
    const book =  await Book.findByIdAndUpdate(req.params.id, 
      {status: false, deletedAt: new Date()},
      {
        new: true
      });

      if (!book || book.status === false) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json({ message: "Book deleted (soft delete)"});
  }
  catch(error) {
    res.status(500).json({
      message: error.message
    });
  }
};