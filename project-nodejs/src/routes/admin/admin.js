const router = require('express').Router();


const AdminController = require('../../controllers/admin/AdminController');
router.get('/init', AdminController.init);

const UserController = require('../../controllers/admin/UserController');
router.get('/login', UserController.getLogin);
router.post('/login', UserController.postLogin);
router.get('/logout', UserController.getLogout);
router.get('/profile', UserController.profile);


// upload

const uploadController = require("../../controllers/file/FileController");
router.post("/upload", uploadController.upload);
router.get("/upload/files", uploadController.getListFiles);
router.get("/upload/files/:name", uploadController.download);



// DASH BOARD

const DashboardController = require('../../controllers/admin/DashboardController');
router.get('/dashboard', DashboardController.index);



// PRODUCT

const RoomCategoryController = require('../../controllers/admin/RoomCategoryController');
router.get('/room/category', RoomCategoryController.index);
router.post('/room/category/create', RoomCategoryController.create);
router.put('/room/category/update/:id', RoomCategoryController.update);
router.get('/room/category/delete/:id', RoomCategoryController.delete);
router.get('/room/category/search', RoomCategoryController.search);
router.get('/room/category/excel/export', RoomCategoryController.exportExcel);
router.post('/room/category/excel/import', RoomCategoryController.importExcel);


const RoomController = require('../../controllers/admin/RoomController');
router.get('/room', RoomController.index);
router.get('/room/verify', RoomController.verify);
router.get('/room/verify/:id', RoomController.sendVerify);
router.get('/room/verify/update/:id', RoomController.updateVerify);
router.post('/room/create', RoomController.create);
router.put('/room/update/:id', RoomController.update);
router.get('/room/delete/:id', RoomController.delete);
router.get('/room/search', RoomController.search);


// Report

const ReportRevenueController = require('../../controllers/admin/ReportRevenueController');
router.get('/report/revenue', ReportRevenueController.index);
router.get('/report/revenue/search', ReportRevenueController.search);
router.get('/report/revenue/excel/export', ReportRevenueController.exportExcel);


const ReportCustomerController = require('../../controllers/admin/ReportCustomerController');
router.get('/report/customer', ReportCustomerController.index);
router.get('/report/customer/search', ReportCustomerController.search);
router.get('/report/customer/excel/export', ReportCustomerController.exportExcel);


// Customer 

const CustomerController = require('../../controllers/admin/CustomerController');
router.get('/customer', CustomerController.index);
router.post('/customer/create', CustomerController.create);
router.put('/customer/update/:id', CustomerController.update);
router.get('/customer/delete/:id', CustomerController.delete);
router.get('/customer/search', CustomerController.search);

// Order 

const OrderController = require('../../controllers/admin/OrderController');
router.get('/order', OrderController.index);
router.post('/order/create', OrderController.create);
router.put('/order/update/:id', OrderController.update);
router.get('/order/delete/:id', OrderController.delete);
router.get('/order/:id', OrderController.detail);
router.put('/order/:id', OrderController.edit);
router.get('/order/search', OrderController.search);
router.get('/order/excel/export', OrderController.exportExcel);

// Contact

const ContactController = require('../../controllers/admin/ContactController');
router.get('/contact', ContactController.index);
router.get('/contact/delete/:id', ContactController.delete);
router.put('/contact/update/:id', ContactController.update);
router.get('/contact/search', ContactController.search);


module.exports = router;