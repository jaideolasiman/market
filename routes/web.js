const authLoginController = require('../controllers/auth/loginController');
const authRegisterController = require('../controllers/auth/registerController');
const authVerifyController = require('../controllers/auth/verifyController');
const authVerifyEdiController = require('../controllers/auth/verifyEditController');
const authLogoutController = require('../controllers/auth/logoutController');
const authTermsController = require('../controllers/auth/termsController');
const profileController = require('../controllers/auth/profileController');
const editController = require('../controllers/auth/editController');


const adminIndexController = require('../controllers/admin/indexController');
const adminManageCategoryController = require('../controllers/admin/manageCategoryController');
const adminManageUserController = require('../controllers/admin/manageUsersController');
const adminManageAuctionController = require('../controllers/admin/manageAuctionController');
const adminManageAuctionResultController = require('../controllers/admin/manageAuctionResultController');
const adminManageItemController = require('../controllers/admin/manageItemsController');
const adminNotificationController = require('../controllers/admin/notificationController');


const farmerIndexController = require('../controllers/farmer/indexController');
const farmerEditProfileController = require('../controllers/farmer/editProfileController');


const buyerIndexController = require('../controllers/buyer/indexController');
const orderController = require('../controllers/buyer/orderController');
const auctionResultController = require('../controllers/buyer/auctionResultController');

const currentbidController = require('../controllers/buyer/currentbidController');

module.exports = function (app) {
  app.get('/login', authLoginController.login);
  app.post('/doLogin', authLoginController.doLogin);
  app.post('/logout', authLogoutController.logout);
  app.get('/register', authRegisterController.register);
  app.post('/doRegister', authRegisterController.doRegister);
  app.get('/verify', authVerifyController.verify);
  app.post('/doVerify', authVerifyController.doVerify);
  app.get('/verifyEdit', authVerifyEdiController.verify);
  app.post('/verifyDoEdit', authVerifyEdiController.doVerify);
  app.get('/terms', authTermsController.index);
  app.post('/upload-profile', profileController.uploadProfilePicture);
  app.get('/profile', profileController.getProfile);
  app.get('/getUserInfo', editController.getUserInfo);
  app.post('/updateUserInfo', editController.updateUserInfo);

  app.get('/admin/index', adminIndexController.index);
  app.get('/admin/generate-report', adminIndexController.generateReport);
  app.get('/admin/manageCategory', adminManageCategoryController.index);
  app.post('/admin/manageCategory/add', adminManageCategoryController.addCategory);
  app.delete('/admin/manageCategory/delete/:id', adminManageCategoryController.deleteCategory);
  app.put('/admin/manageCategory/update/:id', adminManageCategoryController.updateCategory);
  app.get('/admin/manageUsers', adminManageUserController.renderManageUser); // Added
  app.post('/admin/manageUsers/approve/:id', adminManageUserController.approveUser); // Added
  app.post('/admin/manageUsers/deactivate/:id', adminManageUserController.deactivateUser); // Added
  app.get('/admin/manageAuction', adminManageAuctionController.index);
  app.post('/admin/manageAuction/deleteOrder', adminManageAuctionController.deleteOrder);
  app.get('/admin/manageAuctionresult', adminManageAuctionResultController.index);
  app.post('/admin/manageAuctionResult/delete', adminManageAuctionResultController.delete);
  app.get('/admin/manageItem', adminManageItemController.index);
  app.post('/admin/manageItem/approve/:id', adminManageItemController.approveProduct);
  app.post('/admin/manageItem/reject/:id', adminManageItemController.rejectProduct);
  app.post('/admin/manageItem/delete/:id', adminManageItemController.deleteProduct);
  app.get('/admin/notificationController', adminNotificationController.getNotifications);
  

  
  app.get('/farmer/index', farmerIndexController.index);  // Ensure this is correct
  app.post('/farmer/addProduct', farmerIndexController.addProduct);
  app.get('farmer/getBuyers', farmerIndexController.getBuyers);
  app.get('/farmer/notification', farmerIndexController.markNotificationAsRead);
  app.get('/farmer/getFarmerOrders', farmerIndexController.getFarmerOrders);
  app.post('/farmer/processOrder', farmerIndexController.processOrder);
  app.get('/farmer/deleteOrder/:id', farmerIndexController.deleteOrder);
  app.get('/farmer/showBuyers', farmerIndexController.showBuyers);
  app.get('/farmer/showParticipated', farmerIndexController.showParticipated);
  app.get('/farmer/edit-profile', farmerEditProfileController.editProfile);
  app.post('/farmer/update-profile/:id', farmerEditProfileController.updateProfile);
  app.get('/farmer/getAuctionResults', farmerIndexController.getAuctionResults);
  app.post('/farmer/approveAuctionResult', farmerIndexController.approveAuctionResult);
  


  
  
  //app.get('/buyer/notification', auctionResultController.notifyAuctionWinner);
  app.get('/buyer/notification', auctionResultController.markNotificationAsRead);
  app.get('/buyer/notification', buyerIndexController.markNotificationAsRead);
  app.get('/buyer/index', buyerIndexController.index);
  app.get('/buyer/getNotifications', buyerIndexController.getNotifications);
  app.post('/buyer/confirm-purchase', buyerIndexController.confirmPurchase);
  app.post('/buyer/getProducts', buyerIndexController.getProducts);
  app.post('/buyer/confirm-participation', buyerIndexController.confirmParticipation);
  app.get('/buyer/current-bids', buyerIndexController.getCurrentBids);
  app.get('/buyer/auction/room/:productId', currentbidController.index);
  app.post('/buyer/auction/room/:productId', currentbidController.doBid);
  app.get('/buyer/auction/:productId/results', auctionResultController.results);

};