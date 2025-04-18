const Joi = require("joi");

module.exports.listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        location: Joi.string().required(),
        country: Joi.string().required(),
        price: Joi.number().required().min(0),
        
        // Update this part to validate 'image' as an object with 'filename' and 'url'
        image: Joi.object({
            filename: Joi.string().optional(),
            url: Joi.string().uri().required() // URL should be a string and a valid URI
        }).optional()  // 'image' is optional in the schema
    }).required()
});


module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        comment: Joi.string().required(),
        rating: Joi.number().required().min(1).max(5)
    }).required()
});
