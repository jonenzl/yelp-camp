var Campground = require("../models/campground");
var Comment = require("../models/comment");

// All the middleware goes here
var middlewareObj = {};

// Check if the current user is logged in
middlewareObj.isLoggedIn = function(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "You need to be logged in to do that.");
    res.redirect("/login");
}

// Check if the current user created the campground post
middlewareObj.checkCampgroundOwnership = function(req, res, next) {
    // Is the user logged in?
    if (req.isAuthenticated()) {
        Campground.findById(req.params.id, function(err, foundCampground) {
            if (err || !foundCampground) {
                req.flash("error", "Sorry, that campground does not exist.");
                res.redirect("/campgrounds");
            } else {
                // Did the user create this campground?
                if (foundCampground.author.id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                } else {
                    req.flash("error", "You don\'t have permission to do that.");
                    res.redirect("/campgrounds/" + req.params.id);
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that.");
        res.redirect("/campgrounds");
    }
}

// Check if the current user created the comment
middlewareObj.checkCommentOwnership = function(req, res, next) {
    // Is the user logged in?
    if (req.isAuthenticated()) {
        Comment.findById(req.params.comment_id, function(err, foundComment) {
            if (err || !foundComment) {
                req.flash("error", "Comment not found.");
                res.redirect("/campgrounds/" + req.params.id);
            } else {
                // Did the user create this comment?
                if (foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                } else {
                    req.flash("error", "You don\'t have permission to do that.");
                    res.redirect("/campgrounds/" + req.params.id);
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that.");
        res.redirect("/campgrounds/" + req.params.id);
    }
}

module.exports = middlewareObj;