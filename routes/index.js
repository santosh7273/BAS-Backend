const {authenticate, AdminAuthenticate } = require('../middlewares/auth');
const {Userprofile, sellproduct, getallproducts, mylistings, getproductbyid, updateproduct, deleteproduct,register, login, updatepassword  } = 
require('../controllers/userController');
const {AdminLogin,productstobeapproved,ApproveProduct,rejectproduct,AdminProfile}= require('../controllers/adminController');
const { Router } = require('express');
const router = Router();
router.post("/admin_login", AdminLogin);
router.get("/productstobeapproved", AdminAuthenticate, productstobeapproved);
router.post("/approveproduct/:id", AdminAuthenticate, ApproveProduct);
router.post("/rejectproduct/:id", AdminAuthenticate, rejectproduct);
router.get("/admin_profile", AdminAuthenticate, AdminProfile);
router.get("/profile", authenticate, Userprofile);
router.post("/register", register);
router.post("/login", login);
router.post("updatepassword",updatepassword);
router.get("/products",authenticate,getallproducts)
router.post("/sellproduct", authenticate, sellproduct);
router.get("/mylistings", authenticate, mylistings);
router.get("/mylistings/:id", authenticate, getproductbyid);
router.put("/mylistings/updateproduct/:id", authenticate, updateproduct);
router.delete("/mylistings/deleteproduct/:productId", authenticate, deleteproduct);
module.exports = router;


