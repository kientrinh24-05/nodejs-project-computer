const router = require('express').Router();

const HomeController = require('../../controllers/page/HomeController');
router.get('/', HomeController.index);

const AccountController = require('../../controllers/page/AccountController');
router.get('/dang-nhap', AccountController.login);
router.post('/dang-nhap', AccountController.postLogin);
router.post('/dang-ky', AccountController.postRegister);
router.get('/dang-xuat', AccountController.getLogout);
router.get('/ho-so', AccountController.profile);

const ShopController = require('../../controllers/page/ShopController');
router.get('/cua-hang', ShopController.index);
router.get('/cua-hang/tim-kiem', ShopController.search);
router.get('/san-pham/:id', ShopController.detail);

const BlogController = require('../../controllers/page/BlogController');
router.get('/tin-tuc', BlogController.index);
router.get('/bai-viet', BlogController.detail);


const ContactController = require('../../controllers/page/ContactController');
router.get('/lien-he', ContactController.index);
router.post('/lien-he', ContactController.create);

const AboutController = require('../../controllers/page/AboutController');
router.get('/gioi-thieu', AboutController.index);



const CartController = require('../../controllers/page/CartController');
router.get('/gio-hang', CartController.index);
router.post('/checkout', CartController.checkOut);


const WishListController = require('../../controllers/page/WishListController');
router.get('/wishlist', WishListController.index);

const PaymentVnpayController = require('../../controllers/payment/PaymentVnpayController');
router.post('/payment', PaymentVnpayController.create);

module.exports = router;