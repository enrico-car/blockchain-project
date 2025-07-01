const express = require("express");
const multer = require("multer");
const upload = multer();

const Product = require("../../models/Product");

/**
 * Endpoint to obtain the clear information about a product, which are the ones defines in the Product model
 * @param {*} req contains the product identification or the product id
 * @param {*} res will return the corresponding response with a given code
 * @returns 200 and the product info, 404 if no product has been found
 */
const getProductInfo = async (req, res) => {
  //productIdentification might be the id or the name of the product
  //try to retrieve a product in both cases and check if at least one gives a positive result
  const identification = req.params.productIdentification;

  const productByIdentification = await Product.findOne({ productIdentification: identification });
  const productById = await Product.findOne({ id: identification });

  if (!productByIdentification && !productById) {
    return res.status(404).json({ message: "No corresponding product" });
  }

  const product = productByIdentification || productById;
  const productObj = product.toObject();
  //ff image exists, convert it to base64 data URL string
  if (product.image && product.image.data) {
    productObj.image = `data:${
      product.image.contentType
    };base64,${product.image.data.toString("base64")}`;
  }

  // Return the full product object (with all fields)
  return res.status(200).json({ product: productObj, message: "success" });
};

/**
 * Endpoint to obtain the clear information about all products
 * @param {*} req
 * @param {*} res will return the corresponding response with a given code
 * @returns 200 and all the products info, 500 for any error
 */
const getAllProductInfo = async (req, res) => {
  try {
    const products = await Product.find({});

    //convert each product into a js object + image base64
    const productObjs = products.map((product) => {
      const obj = product.toObject();
      if (product.image && product.image.data) {
        obj.image = `data:${
          product.image.contentType
        };base64,${product.image.data.toString("base64")}`;
      }

      return obj;
    });

    return res.status(200).json({ products: productObjs, message: "success" });
  } catch (err) {
    console.error("Error in getAllProductInfo:", err);
    return res.status(500).json({ message: "Error in product retrival" });
  }
};

/**
 * Endpoint to add a new product by following the Product model
 * @param {*} req contains the product infos
 * @param {*} res will return a message based on the outcome
 * @returns 200 if the product has been saved, 500 otherwise
 */
const addProduct = async (req, res) => {
  try {
    //list of all possible fileds accepted but not all required
    const allowedFields = [
      "id",
      "productIdentification",
      "materials",
      "design",
      "specifications",
      "lifecycle",
      "installation_maintenance",
      "composition",
      "microplastics",
      "env_impact",
      "repair_replace",
      "reuse_recycling",
      "maintenance",
      "warranty",
      "energy_recovery",
      "substance_of_concern",
    ];

    const productData = {};

    //parse fields from req.body; parse JSON strings for array fields
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        productData[field] = req.body[field];
      }
    }

    //handle uploaded image if any
    if (req.file) {
      productData.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    const product = new Product(productData);
    await product.save();

    return res.status(201).json({ message: "success" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "database error" });
  }
};

/**
 * Endpoint to delete a product
 * @param {*} req contains the product identification
 * @param {*} res will return a message based on the outcome
 * @returns 200 if the product has been deleted, 404 if not found, 500 otherwise
 */
const deleteProduct = async (req, res) => {
  const identifier = req.params.productIdentification;

  try {
    // try to delete by id
    let deletedProduct = await Product.findOneAndDelete({ id: identifier });

    // if not found by id, try productIdentification
    if (!deletedProduct) {
      deletedProduct = await Product.findOneAndDelete({ productIdentification: identifier });
    }

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      message: "Product deleted successfully",
      product: deletedProduct,
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = function () {
  const router = express.Router();

  router.get("/info/:productIdentification", getProductInfo);
  router.delete("/delete/:productIdentification", deleteProduct);
  router.get("/all", getAllProductInfo);
  router.post("/create", upload.single("image"), addProduct);

  return router;
};
