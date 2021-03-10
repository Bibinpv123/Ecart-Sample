var db = require('../config/connection')
var collection=require('../config/collection')
const bcrypt=require('bcrypt')
const { ObjectId } = require('mongodb')
const { response } = require('express')
const Razorpay = require('razorpay')
const { resolve } = require('dns')
var instance = new Razorpay({
    key_id: 'rzp_test_iBeDSy62rAnOC2',
    key_secret: 'cJAWnQ7LC1i0ZXTunCDIf1qr',
  });
module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
          userData.Password= await bcrypt.hash(userData.Password,10)
          db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
             resolve(data.ops[0])
          })   
        })  
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let LoginStatus= false
            let response ={}
               let user = await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
               if(user){
                bcrypt.compare(userData.Password,user.Password).then(status=>{
                    if(status){
                        console.log('success')
                        response.user=user
                        response.status=true
                        resolve(response)
                    }
                    else{
                        console.log('failed')
                        resolve({status:false})
                    }
               
                })  
            }
            else{
                console.log('Login Failed')
                resolve({status:false})
            }
        })
    }  ,
    addToCart:(proId,userId)=>{
        let proObj={
            item:ObjectId(proId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
            if(userCart){
                let proExist=userCart.products.findIndex(product=>product.item==proId)
            console.log(proExist);
                if(proExist!=-1){
                     db.get().collection(collection.CART_COLLECTION)
                     .updateOne({user:ObjectId(userId),'products.item':ObjectId(proId)},
                         {
                             $inc:{'products.$.quantity':1}
                         }
                     ).then(()=>{
                         resolve()
                     })
                    }
                else{
                
            db.get().collection(collection.CART_COLLECTION).updateOne(
                {user:ObjectId(userId)},
                {
                    
                        $push:{products:proObj}
                    
                }
            ).then((resp)=>{
                resolve()
            })
                }
            }
            else{
                let cartObj={
                    user:ObjectId(userId),
                    // products:[ObjectId(proId)]
                    products:[proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                   resolve()
                })
            }
        })
    },
    getCartProducts:((userId)=>{
return new Promise(async(resolve,reject)=>{

    let cartItems= await db.get().collection(collection.CART_COLLECTION).aggregate([
        {
            $match:{user:ObjectId(userId)}
        },
        {
            $unwind:'$products'
        },
        {
            $project:{
                item:"$products.item",
                quantity:'$products.quantity'
            }
        },
        {
          $lookup:{
            from:collection.PRODUCT_COLLECTION,
            localField:'item',
            foreignField:'_id',
            as:'product'
            }
    
        },
        {
            $project:{
                item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
            }
        }
        // {
        //   $lookup:{
        //       from:collection.PRODUCT_COLLECTION,
        //       let :{proList:'$products'},
        //       pipeline:[
        //           {
        //               $match:{
        //                   $expr:{
        //                       $in:['$_id',"$$proList"]
        //                   }
        //               }
        //           }
        //       ],
        //       as:'cartItems'

        //   }
        // }


    ]).toArray()
    // console.log(cartItems)
    // console.log(cartItems[0].products)
    // resolve(cartItems[0].cartItems)
    resolve(cartItems)
 })
    }),

    getCartCount:(userId)=>{
        return new Promise(async (resolve,reject)=>{
            let count=null
let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})

     if(cart){
         count=cart.products.length
     }
     resolve(count)
        })
    },

    changeProductQuantity:(details)=>{
        console.log(details)
        details.count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)
        return new Promise((resolve,reject)=>{
            if(details.count==-1 && details.quantity==1){
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:ObjectId(details.cart)},
                {
                 $pull:{products:{item:ObjectId(details.product)}}
                }).then((response)=>{

                    resolve({removeProduct:true})
                })
            }
            else{

            db.get().collection(collection.CART_COLLECTION)
            .updateOne({_id:ObjectId(details.cart),'products.item':ObjectId(details.product)},
                {
                    $inc:{'products.$.quantity':details.count}
                }
            ).then((response)=>{
                resolve({status:true})
            })
        }
        })
    
    


},

    deleteProduct:(detail)=>{
        console.log(detail)
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTION)
            .updateOne({_id:ObjectId(detail.cart)},
            {
             $pull:{products:{item:ObjectId(detail.product)}}
            }).then((response)=>{

                resolve()
            })
        })
    },
    getTotalAmount:(userId)=>{
        
        return new Promise(async(resolve,reject)=>{
           let   total= await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:ObjectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:"$products.item",
                        quantity:'$products.quantity'
                    }
                },
                {
                  $lookup:{
                    from:collection.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'product'
                    }
            
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                },
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:['$quantity','$product.Price']}}
                    }

                }
                // {
                //   $lookup:{
                //       from:collection.PRODUCT_COLLECTION,
                //       let :{proList:'$products'},
                //       pipeline:[
                //           {
                //               $match:{
                //                   $expr:{
                //                       $in:['$_id',"$$proList"]
                //                   }
                //               }
                //           }
                //       ],
                //       as:'cartItems'
        
                //   }
                // }
        
        
            ]).toArray()
            
            // console.log(cartItems[0].products)
            // resolve(cartItems[0].cartItems)
            if(total[0]){
            resolve(total[0].total)
            }
            else{
                resolve(0)
            }
         })
    },
    placeOrder:(order,products,total)=>{
        return new Promise((resolve,reject)=>{
            console.log(order,products,total)
            let status=order['payment-method']==='COD'?'Placed':'pending'
            let orderObj={
                deliveryDetails:{
                    mobile:order.mobile,
                    address:order.address,
                    pincode:order.pincode

                },
                userId:ObjectId(order.userId),
                paymentMethod:order['payment-method'],
                products:products,
                totalAmount:total,
                status:status,
                date:new Date()
                
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response=>{
                db.get().collection(collection.CART_COLLECTION).removeOne({user:ObjectId(order.userId)})
                console.log("ord"+response.ops[0]._id)
                resolve(response.ops[0]._id)
            }))
        })
    },
    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
            resolve(cart.products)
        })
    },
    getOrderDetails:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let order= await db.get().collection(collection.ORDER_COLLECTION).find({userId:ObjectId(userId)}).toArray()
            resolve(order)
        })
    },
    getOrderProdcts:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            let orderItem= await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:ObjectId(orderId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:"$products.item",
                        quantity:'$products.quantity'
                    }
                },
                {
                  $lookup:{
                    from:collection.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'product'
                    }
            
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray()
            console.log(orderItem)
            resolve(orderItem)
        })
    },
    generateRazorpay:(orderId,total)=>{
        return new Promise((resolve,reject)=>{
            var options = {
                amount: total*100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: ""+orderId
              };
              instance.orders.create(options, function(err, order) {
                  if(err){
                      console.log(err)
                  }else{
                console.log('New Order:',order);
                resolve(order)
                  }
              });
        })

    },
    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'cJAWnQ7LC1i0ZXTunCDIf1qr');
            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
            hmac=hmac.digest('hex')
            if(hmac==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
        })
    },
    changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION)
            .updateOne({_id:ObjectId(orderId)},
            {
                $set:{
                    status:'placed'
                }
            }
        ).then(()=>{
            resolve()
        })
        })

    }
}