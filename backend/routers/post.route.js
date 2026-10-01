const express = require("express");
const {
	createPost,
	getPosts,
	getPost,
	updatePost,
	deletePost
} = require("../controllers/post.controller");
const { protect } = require("../middlewares/auth.middleware");

const postRouter = express.Router();

postRouter.get("/", getPosts);
postRouter.post("/", protect, createPost);
postRouter.get("/:id", getPost);
postRouter.put("/:id", protect, updatePost);
postRouter.delete("/:id", protect, deletePost);

module.exports = postRouter;
