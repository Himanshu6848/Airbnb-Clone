const { listingSchema } = require("/js/schema.js");  // Assuming the schema is in "schema.js"
const ExpressError = require("./utils/ExpressError.js");  // Custom error handler

const validateListing = (req, res, next) => {
    // Joi validation
    let { error } = listingSchema.validate(req.body);  // Ensure we validate the top-level 'listing'

    if (error) {
        // Combine error messages and throw an ExpressError with status code 400 (Bad Request)
        let errMsg = error.details.map((el) => el.message).join(", ");
        return next(new ExpressError(400, errMsg));
    }

    // Proceed to next middleware or route handler if validation is successful
    next();
};

module.exports = validateListing;
