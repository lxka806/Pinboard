const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
        },

        profilePicture: {
            type: String,
            default: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/077612dd-213c-43ab-90b1-a336fed073d5/di68pim-60c20af8-4ccc-497e-b83c-a017946333ba.jpg/v1/fill/w_368,h_368,q_75,strp/default_pfp_by_fleshingot_di68pim-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MzY4IiwicGF0aCI6Ii9mLzA3NzYxMmRkLTIxM2MtNDNhYi05MGIxLWEzMzZmZWQwNzNkNS9kaTY4cGltLTYwYzIwYWY4LTRjY2MtNDk3ZS1iODNjLWEwMTc5NDYzMzNiYS5qcGciLCJ3aWR0aCI6Ijw9MzY4In1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmltYWdlLm9wZXJhdGlvbnMiXX0.33Di3vfiqVT84MJhXaV74KD_1m1KwzG8diHM9SGZsUk",
        },

        bio: {
            type: String,
            default: "",
            maxlength: 160,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("User", userSchema);