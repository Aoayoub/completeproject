const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Product = require('../models/product');
const Bid = require('../models/bid');
const Comment = require('../models/comment');
const { getUserId } = require('../auth');
const { latestProductCount } = require('../config');

// Set up Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const extension = path.extname(file.originalname);
        cb(null, uniqueSuffix + extension);
    }
});

// Configure Multer upload
const upload = multer({ storage });

function createProduct(req, res, next) {
    upload.single('image')(req, res, (err) => {
        if (err) {
            return next(err);
        }

        const { file } = req;
        const product = {
            title: req.body.title,
            description: req.body.description,
            endTime: req.body.endTime,
            startPrice: req.body.startPrice,
            creator: getUserId(req),
            image: file.filename // Store the filename in the image field
        };

        Product.create(product)
            .then(product => {
                res.json(product);
            })
            .catch(next);
    });
}

function deleteProduct(req, res, next) {
    const id = req.productId;

    Product.findByIdAndDelete(id)
        .then(res.json.bind(res))
        .catch(next);
}

function editProduct(req, res, next) {
    const id = req.productId;

    const { title = '', description = '' } = req.body;

    Product.findByIdAndUpdate(id, { $set: { title, description } })
        .then(product => {
            res.json(Object.assign({}, product.toObject(), { title, description }));
        })
        .catch(next);
}

function latest(req, res, next) {
    Product.find().sort({ createTime: -1 }).limit(latestProductCount)
        .then(res.json.bind(res))
        .catch(next);
}

function allProducts(req, res, next) {
    const { skip, take, sort = 0 } = req.query;

    const sortMapping = [{ likes: -1 }, { createTime: -1 }];

    Product.find({}).sort(sortMapping[sort]).skip(Number(skip)).limit(Number(take))
        .then(res.json.bind(res))
        .catch(next);
}

function details(req, res, next) {
    const product = req.product.toObject();

    const isOwner = product.creator._id.toString() === getUserId(req);

    product.isOwner = isOwner;
    product.bids = [];

    Bid.find({ product: product._id.toString() })
        .sort({ priceValue: -1 })
        .populate('creator', ['-password', '-__v'])
        .then(bids => {
            product.priceValue = (bids[0] || {}).priceValue;
            if (isOwner) {
                product.bids = bids;
            }
            res.json(product);
        })
        .catch(next);
}

function addBid(req, res, next) {
    const productId = req.productId;

    Bid.findOne({ product: productId.toString() })
        .sort({ priceValue: -1 })
        .then(bid => {
            const latestPriceValue = bid ? bid.priceValue : req.product.startPrice;
            if (req.body.priceValue <= latestPriceValue) {
                return next('bid priceValue must be larger than current product price');
            }

            Bid.create({
                priceValue: Number(req.body.priceValue),
                creator: getUserId(req),
                product: productId
            })
                .then(bid => {
                    res.json(bid);
                })
                .catch(next);
        });
}

function getProductsCount(req, res, next) {
    Product.count({}).then(count => {
        res.json({ count });
    });
}

function createComment(req, res, next) {
    const { product } = req;
    const { comment } = req.body;

    Comment.create({ body: comment, creator: getUserId(req) })
        .then(comment => {
            product.comments.push(comment._id);
            product.save();
            res.json(comment);
        })
}

function like(req, res, next) {
    const { product } = req;

    console.log(product.likes);
    if (product.likes.includes(getUserId(req))) {
        return next('user already liked');
    }

    product.likes.push(getUserId(req));
    product.save();

    res.json(product);
}

module.exports = {
    createProduct,
    deleteProduct,
    editProduct,
    latest,
    allProducts,
    details,
    addBid,
    getProductsCount,
    createComment,
    like
};