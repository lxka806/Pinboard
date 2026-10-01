import { Routes, Route } from "react-router-dom";

import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/profile";
import PostDetails from "./pages/postdetails"
import CreatePost from "./pages/CreatePost";

function App() {
    return (
        <>
            <NavBar />

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/create" element={<CreatePost />} />
                <Route path="/post/:id" element={<PostDetails />} />
            </Routes>
        </>
    );
}

export default App;