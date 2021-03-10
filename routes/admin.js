var express = require('express');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
var productHelper =require('../helpers/product-helpers')
/* GET users listing. */
const verifyLogin=(req,res,next)=>{

  if(req.session.admin.loggedIn){
     next()
  }else
  res.redirect('/login')
}
router.get('/view',function(req, res, next) {
  let admin = req.session.admin
  productHelper.getAllProducts().then((products)=>{
    console.log(products)
    res.render('admin/view-products',{admin:true,products,admin})
  })
  
});
router.get('/',function(req,res){
  if(req.session.admin){
    res.redirect('/admin/view')
  }else{
res.render('admin/login',{"loginError":req.session.adminLoginError})
req.session.adminLoginError=false
  }
})
router.post('/login',(req,res)=>{
  productHelper.doLogin1(req.body).then((resp)=>{
if(resp.status){
  req.session.admin=resp.admin
  req.session.admin.loggedIn =true
  res.redirect('view')
}
else{
  req.session.adminLoginError = "Invalid Username and Password"
  res.redirect('/admin')
}
  })
})
router.get('/logout',(req,res)=>{
  req.session.admin=null
  res.redirect('/admin')
})
 
router.get('/add-product',function(req,res){
  res.render('admin/add-product',{admin:true})
})
router.post('/add-product',(req,res)=>{
  productHelper.addProduct(req.body,(id)=>{
    let image =req.files.Image
    image.mv('./public/product-images/'+id+'.jpg',(err)=>{
      if(!err){
        res.render('admin/add-product')
      }else{
        console.log(err)
      }
    })
    
  })
})
// router.get('/delete-product/',function(req,res){
//   let proId = req.query.id
// })
router.get('/delete-product/:id',function(req,res){
  let proId = req.params.id
  productHelpers.deleteProduct(proId).then((data)=>{
    res.redirect('/admin')
  })
})
router.get('/edit-product/:id',async (req,res)=>{
  let products= await productHelper.getProductDetails(req.params.id)
  console.log(products)
  res.render('admin/edit-product',{admin:true,products})
})
router.post('/edit-product/:id', (req,res)=>{
   productHelper.updateProduct(req.params.id,req.body).then((resp)=>{
     console.log("txt")
     res.redirect('/admin')
     if(req.files){
       let image= req.files.Image
      image.mv('./public/product-images/'+req.params.id+'.jpg',(err)=>{
      })
     }
   })
})

module.exports = router;
