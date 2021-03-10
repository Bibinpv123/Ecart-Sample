var db = require('../config/connection')
var collection=require('../config/collection')
const { ObjectId } = require('mongodb')
const { response } = require('express')
const bcrypt=require('bcrypt')
module.exports={
    addProduct:(product,callback)=>{
        product.Price=parseInt(product.Price)
        db.get().collection('product').insertOne(product).then((data)=>{
            console.log(data)
            callback(data.ops[0]._id)
        })
    },
    getAllProducts:()=>{
return new Promise(async(resolve,reject)=>{
    let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
    resolve(products)
})
    },

    deleteProduct:(prodId)=>{
        return new Promise((resolve,reject)=>{
         db.get().collection(collection.PRODUCT_COLLECTION).removeOne({_id:ObjectId(prodId)}).then((data)=>{
   resolve(data)
         })
        })
    },
    getProductDetails:(proId)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:ObjectId(proId)}).then((productone)=>{
resolve(productone)
        })
    })
},
updateProduct:(prodId,prodDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
                {_id:ObjectId(prodId)},
                [
                {$set:{ 
                   Name: prodDetails.Name,
                   Catagory:prodDetails.Catagory,
                   Description:prodDetails.Description,
                   Price:prodDetails.Price }
                }]).then((response)=>{
                    resolve(response)
                })
        })
    
    
    },
    doLogin1:(adminData)=>{
        return new Promise(async(resolve,reject)=>{
            let LoginStatus= false
            let response ={}
               let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({Email:adminData.Email})
               if(admin){
                bcrypt.compare(adminData.Password,admin.Password).then(status=>{
                    if(status){
                        console.log('success')
                        response.admin=admin
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
    }
}