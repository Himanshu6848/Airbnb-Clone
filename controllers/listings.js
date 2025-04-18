const Listing = require("../models/listing");
const opencage = require("opencage-api-client");


// Index Route
module.exports.indexRoute = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
};


// New Route
module.exports.newRoute = (req, res) => {
    res.render("listings/new.ejs");
};

// Show Route
module.exports.showRoute = async (req, res, next) => {
try{
    let { id } = req.params;

    const listing = await Listing.findById(id).populate({
        path: "reviews",
        populate: {
            path: "author",
        },
    }).populate("owner");

    if (!listing) {
        req.flash("error", "Cannot find that listing!");
        return res.redirect("/listings");
    }

    const location = listing.location;
    if (location) {
        try {
            const response = await opencage.geocode({ q: location, key: process.env.OPENCAGE_API_KEY });

            if (response.results && response.results.length > 0) {
                // Here, setting geometry to the coordinates from OpenCage API response
                listing.geometry = response.results[0].geometry;
            } else {
                // If no result from OpenCage, set geometry as null
                listing.geometry = null;
            }
        } catch (err) {
            console.error("OpenCage error:", err); // just in case!
            listing.geometry = null;
        }
    }

    // Log the listing to check if geometry is being set
    // console.log(listing.geometry);

    // Render the show page, passing listing object (which contains geometry)
    res.render("listings/show.ejs", { listing });
} catch (err) {
    next(err); // Passes error to Express error handler
  }
};



// Create Route (To save a new listing)
module.exports.createRoute = async (req, res) => {
    const { location } = req.body.listing;

    // Get coordinates from OpenCage
    const data = await opencage.geocode({ q: location, key: process.env.OPENCAGE_API_KEY });

    if (!data.results.length) {
        req.flash("error", "Location not found!");
        return res.redirect("/listings/new");
    }

    const coordinates = data.results[0].geometry;
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.geometry = coordinates; // Save coordinates to DB
    if (req.file) {
        newListing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
    }
    await newListing.save();

    req.flash("success", "Successfully created a new listing!");
    res.redirect(`/listings/${newListing._id}`);
};



// Edit Route
module.exports.editRoute = (async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Cannot find that listing!");
        return res.redirect("/listings");
    }
    let originalImageURL = listing.image.url;
    originalImageURL = originalImageURL.replace("/upload", "/upload/h_300,w_250");
    res.render("listings/edit.ejs", { listing, originalImageURL });
});


// Update Route (For editing an existing listing)
module.exports.updateRoute = (async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    if (typeof req.file != "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }
    req.flash("success", "Successfully updated the listing!");
    res.redirect(`/listings/${id}`);
});


// Delete Route
module.exports.deleteRoute = (async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing.owner.equals(res.locals.currentUser._id)) {
        req.flash("error", "You do not have permission to delete this listing!");
        return res.redirect(`/listings/${id}`);
    }

    await Listing.findByIdAndDelete(id);
    req.flash("success", "Successfully deleted the listing!");
    res.redirect("/listings");
});

