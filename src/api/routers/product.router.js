const express = require("express");
const { Web3 } = require("web3");

const web3 = new Web3(process.env.CHAIN_URL);

const Product = require('../../models/Product')

const getProductInfo = async (req, res) => {
    const identification = req.params.identification;
    
    const productIdentification = await Product.findOne({identification: identification});
    const productId = await Product.findOne({id: identification});

    if (!productIdentification && !productId)
        return res.status(400).json({ message: 'no corresponding product' });

    var product = (productIdentification) ? productIdentification : productId;

    const pub = {
        _id: product._id,
        id: product.id,
        identification: product.identification,
        materials: product.materials,
    }

    return res.status(200).json({ product: pub, message: "success" });
}

const addProduct = async (req, res) => {
    const body = req.body;

    const product = new Product({
        id: body.id,
        identification: body.identification,
        materials: body.materials,
    });

    try {
        await product.save();
        return res.status(201).json({ message: 'success' });
    } catch (error) {
        return res.status(500).json({ message: 'database Error' });
    }
}

module.exports = function () {
  const router = express.Router();

  router.get("/info/:identification", getProductInfo);
  router.post("/create", addProduct);

  return router;
};
