var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");

// Route to the landing page
router.get("/", function(req, res) {
    res.render("landing");
});

// ============================
// AUTHENTICATION ROUTES
// ============================

// REGISTER NEW USER - Show register form
router.get("/register", function(req, res) {
    res.render("register", {page: "register"});
});

// CREATE NEW USER - Add new user to database
router.post("/register", function(req, res) {
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user) {
        if (err) {
            // req.flash("error", err.message);
            return res.render("register", {error: err.message});
        }
        passport.authenticate("local")(req, res, function() {
            req.flash("success", "Welcome to YelpCamp " + user.username);
            res.redirect("/campgrounds");
        });
    });
});

// SHOW LOGIN FORM
router.get("/login", function(req, res) {
    res.render("login", {page: "login"});
})

// LOGIN
router.post("/login", passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
}), function(req, res) {
});

// LOGOUT
router.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "You have been logged out.");
    res.redirect("/campgrounds");
});

module.exports = router;