const express = require("express");
const multer = require("multer");
const upload = multer(); 

const Product = require('../../models/Product')

const getProductInfo = async (req, res) => {
  const identification = req.params.productIdentification;

  const productByIdentification = await Product.findOne({ productIdentification: identification });
  const productById = await Product.findOne({ id: identification });

  if (!productByIdentification && !productById) {
    return res.status(400).json({ message: 'No corresponding product' });
  }

  const product = productByIdentification || productById;

  // Convert mongoose doc to plain JS object
  const productObj = product.toObject();

  // If image exists, convert it to base64 data URL string
  if (product.image && product.image.data) {
    productObj.image = `data:${product.image.contentType};base64,${product.image.data.toString('base64')}`;
  }

  // Return the full product object (with all fields)
  return res.status(200).json({ product: productObj, message: "success" });
};

const addProduct = async (req, res) => {
  try {
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

    // Parse fields from req.body; parse JSON strings for array fields
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (
          ["materials", "design", "specifications", "composition", "env_impact",
           "repair_replace", "reuse_recycling", "maintenance", "substance_of_concern"].includes(field)
        ) {
          // parse JSON strings for arrays, if sent as stringified JSON
          try {
            productData[field] = JSON.parse(req.body[field]);
          } catch {
            // fallback if parsing fails
            productData[field] = [];
          }
        } else {
          productData[field] = req.body[field];
        }
      }
    }

    // Handle uploaded image if any
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

    return res.status(200).json({ message: "Product deleted successfully", product: deletedProduct });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


module.exports = function () {
    const router = express.Router();

    router.get("/info/:productIdentification", getProductInfo);
    router.delete("/delete/:productIdentification", deleteProduct);
    router.post("/create", upload.single("image"), addProduct);

    return router;
};
