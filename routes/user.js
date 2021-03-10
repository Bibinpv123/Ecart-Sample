const { response } = require('express');
var express = require('express');
const session = require('express-session');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')
var userHelper = require('../helpers/user-helper')
/* GET home page. */
const verifyLogin=(req,res,next)=>{
  if(req.session.user.loggedIn){
     next()
  }else
  res.redirect('/login')
}
router.get('/', async function(req, res, next) {
   let user = req.session.user
   let cartCount=null
   if(req.session.user){
    cartCount=await userHelper.getCartCount(req.session.user._id)
   }
  productHelper.getAllProducts().then((products)=>{
    res.render('user/view-products',{products,user,cartCount})
  })
});

router.get('/login',function(req,res){
  if(req.session.user){
    res.redirect('/')
  }else{
res.render('user/login',{"loginError":req.session.userLoginError})
req.session.userLoginError=false
  }
})
router.get('/signup',function(req,res){
  res.render('user/signup')
  })
router.post('/signup',(req,res)=>{
userHelper.doSignup(req.body).then((resp)=>{
req.session.user=response
req.session.user.loggedIn =true
res.redirect('/')
})
})
router.post('/login',(req,res)=>{
  userHelper.doLogin(req.body).then((resp)=>{
if(resp.status){
  req.session.user=resp.user
  req.session.user.loggedIn =true
  res.redirect('/')
}
else{
  req.session.userLoginError = "Invalid Username and Password"
  res.redirect('/login')
}
  })
})
router.get('/logout',(req,res)=>{
  req.session.user=null
  res.redirect('/')
})

router.get('/cart',verifyLogin, async(req,res)=>{
let products= await userHelper.getCartProducts(req.session.user._id)
// let totalValue=0
// if(products.length>0){
// totalValue= await userHelper.getTotalAmount(req.session.user._id)
// }
totalValue= await userHelper.getTotalAmount(req.session.user._id)
// let totalValuePromise= await userHelper.getTotalAmount(req.session.user._id).then((response=>{
//   console.log(response)
// totalValue=response
// }))
// console.log(products)
  res.render('user/cart',{products,user:req.session.user,totalValue})
})

router.get('/add-to-cart/:id',(req,res)=>{
  console.log("api call")
  userHelper.addToCart(req.params.id,req.session.user._id).then(()=>{
// res.redirect('/')
res.json({status:true})
  })
})
router.post('/change-product-quantity',(req,res,next)=>{
  
  userHelper.changeProductQuantity(req.body).then(async(response)=>{
    response.total =await userHelper.getTotalAmount(req.body.user)
    res.json(response)

  })
})
router.post('/delete-product',(req,res,next)=>{
  console.log('reach')
userHelper.deleteProduct(req.body).then(()=>{
  res.json()
})
})
router.get('/place-order',verifyLogin,async (req,res)=>{
  let total =await userHelper.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{total,user:req.session.user})
})
router.post('/place-order',async(req,res)=>{
  let products=await userHelper.getCartProductList(req.body.userId)
  let totalPrice = await userHelper.getTotalAmount(req.body.userId)
  userHelper.placeOrder(req.body,products,totalPrice).then((orderId)=>{
    if(req.body['payment-method']==='COD'){
res.json({codSuccess:true})
    }else{
      userHelper.generateRazorpay(orderId,totalPrice).then((response)=>{
res.json(response)
      })
    }

  })
  
  console.log(req.body)
})
router.get('/success',verifyLogin,(req,res)=>{
  res.render('user/success',{user:req.session.user})
})
router.get('/order-details',verifyLogin,async(req,res)=>{

  let orderDetails=await userHelper.getOrderDetails(req.session.user._id)
  console.log(orderDetails)
  res.render('user/order-details',{orderDetails,user:req.session.user})
})

router.get('/view-order-product/:id',async(req,res)=>{
let products=await userHelper.getOrderProdcts(req.params.id)
res.render('user/order-product',{user:req.session.user,products})
})
router.post('/verify-payment',(req,res)=>{
console.log(req.body);
userHelper.verifyPayment(req.body).then(()=>{
  
  userHelper.changePaymentStatus(req.body['order[receipt]']).then(()=>{
    res.json({status:true})
  })
}).catch((err)=>{
  console.log(err);
  res.json({status:false,errMsg:''})
})

});
module.exports = router;
