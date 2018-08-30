var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware/index");
var nodeGeocoder = require("node-geocoder");

var options = {
    provider: "google",
    httpAdapter: "https",
    apiKey: process.env.GEOCODER_API_KEY,
    formatter: null
};

var geocoder = nodeGeocoder(options);

// ============================
// CAMPGROUND ROUTES
// ============================

// INDEX - Show all campgrounds
router.get("/", function(req, res) {
    var noMatch = null;
    if (req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), "gi");
        // Retrieve and render all the campgrounds from the database
        Campground.find({name: regex}, function(err, allCampgrounds) {
            if (err) {
                console.log(err);
            } else {
                if (allCampgrounds.length < 1) {
                    noMatch = "No campgrounds match that query, please try again."
                }
                res.render("campgrounds/index", {campgrounds: allCampgrounds, page: "campgrounds", noMatch: noMatch});
            }
        });
    } else {
        // Retrieve and render all the campgrounds from the database
        Campground.find({}, function(err, allCampgrounds) {
            if (err) {
                console.log(err);
            } else {
                res.render("campgrounds/index", {campgrounds: allCampgrounds, page: "campgrounds", noMatch: noMatch});
            }
        });
    }
});

// NEW CAMPGROUND - Show form to create a new campground
router.get("/new", middleware.isLoggedIn, function(req, res) {
    res.render("campgrounds/new");
});

// CREATE CAMPGROUND - Add new campground to database
router.post("/", middleware.isLoggedIn, function(req, res) {
    // Get data from form
    var name = req.body.name;
    var image = req.body.image;
    var description = req.body.description;
    var price = req.body.price
    var author = {
        id: req.user._id,
        username: req.user.username
    };
    geocoder.geocode(req.body.location, function(err, data) {
        if (err || !data.length) {
            req.flash("error", "Invalid location.");
            return res.redirect("back");
        }
        var lat = data[0].latitude;
        var lng = data[0].longitude;
        var location = data[0].formattedAddress;
        var newCampground = {name: name, image: image, description: description, price: price, author: author, location: location, lat: lat, lng: lng};
        // Create a new campground and save it to the database
        Campground.create(newCampground, function(err, newlyCreated) {
            if (err) {
                console.log(err);
            } else {
                // Redirect back to campgrounds page
                res.redirect("/campgrounds");
            }
        });
    });
});

// SHOW CAMPGROUND - Show information for a specific campground
router.get("/:id", function(req, res) {
    // Find the campground with the id provided
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground) {
        if (err || !foundCampground) {
            req.flash("error", "Sorry, that campground does not exist.");
            res.redirect("/campgrounds");
        } else {
            // Render the show template with that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

// EDIT CAMPGROUND - Show the edit form for a specific campground
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res) {
    Campground.findById(req.params.id, function(err, foundCampground) {
        res.render("campgrounds/edit", {campground: foundCampground});
    });
});

// UPDATE CAMPGROUND - Update the information for a specific campground in the database
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res) {
    geocoder.geocode(req.body.location, function(err, data) {
        if (err || !data.length) {
            req.flash("error", "Invalid location.");
            return res.redirect("back");
        }
        req.body.campground.lat = data[0].latitude;
        req.body.campground.lng = data[0].longitude;
        req.body.campground.location = data[0].formattedAddress;
        
        // Find and update the specific campground
        Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground) {
            if (err) {
                req.flash("error", err.message);
                res.redirect("/campgrounds");
            } else {
                req.flash("success", "Successfully updated the campground.");
                res.redirect("/campgrounds/" + req.params.id);
            }
        });
    });
});

// DESTROY CAMPGROUND - Delete a specific campground
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res) {
    // Find and delete the specific campground
    Campground.findByIdAndRemove(req.params.id, function(err, deletedCampground) {
        if (err) {
            res.redirect("/campgrounds");
        } else {
            res.redirect("/campgrounds");
        }
    })
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;