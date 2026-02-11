import Author from "../models/author.model.js";
import Book from "../models/book.model.js";


// create author
export const createAuthor = async (req, res) => {
  try{
    const { name, bio, birthDate} = req.body;

    if(!name){
      return res.status(400).json({
        success: false,
        message: "Author name is required"
      });
    }

    const author = await Author.create({
      name, 
      bio,
      birthDate
    });

    res.status(201).json({
      success: true,
      data: author
    });
  }catch(error){
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// get authors

export const getAuthors = async (req, res) => {
  try{
    const author = await Author.find({ status: true});
    res.json({
      success: true,
      data: author
    })
  }catch(error){
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// get single

export const getSingleAuthor = async (req, res) =>{
  try{
    const author = await Author.findOne({
      _id: req.params.id,
      status: true
    });

    if(!author){
      return res.status(404).json({
        message: "Author not found"
      });
    }

    const books = await Book.find({
      author: author._id,
      status: true
    });

    res.json({
      success: true,
      data:{
        author,
        books
      }
    })
  }catch(error){
    res.status(500).json({
      message: error.message
    });
  }
};

// update
export const updateAuthor = async (req, res) => {
  try{
    const author = await Author.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if(!author){
      return res.status(404).json({
        message: "Author not found"
      });
    }

    res.json({
      success: true,
      data: author
    })
  } catch(error){
    res.status(500).json({
      message: error.message
    });
  }
};

// delete
export const deleteAuthor = async (req, res) => {
  try {

    const author = await Author.findByIdAndUpdate(
      req.params.id,
      { status: false },
      { new: true }
    );

    if (!author) {
      return res.status(404).json({
        message: "Author not found"
      });
    }

    res.json({
      success: true,
      message: "Author deleted (soft delete)"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

