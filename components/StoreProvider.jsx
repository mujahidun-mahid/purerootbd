"use client";
import {createContext,useContext,useEffect,useMemo,useState} from "react";
const Ctx=createContext(null);
export function StoreProvider({children}){
 const [cart,setCart]=useState([]);
 const [wishlist,setWishlist]=useState([]);
 useEffect(()=>{try{setCart(JSON.parse(localStorage.getItem("pr-cart")||"[]"));setWishlist(JSON.parse(localStorage.getItem("pr-wishlist")||"[]"))}catch{}},[]);
 useEffect(()=>{localStorage.setItem("pr-cart",JSON.stringify(cart))},[cart]);
 useEffect(()=>{localStorage.setItem("pr-wishlist",JSON.stringify(wishlist))},[wishlist]);
 const add=(product,size="500g",qty=1)=>{const pkg=product.packages.find(x=>x.size===size)||product.packages[0];setCart(c=>{const key=product.id+"-"+pkg.size;const found=c.find(x=>x.key===key);if(found)return c.map(x=>x.key===key?{...x,qty:x.qty+qty}:x);return [...c,{key,productId:product.id,slug:product.slug,name:product.name,size:pkg.size,price:pkg.price,qty,imageType:product.category}]})};
 const remove=key=>setCart(c=>c.filter(x=>x.key!==key));
 const update=(key,qty)=>setCart(c=>qty<=0?c.filter(x=>x.key!==key):c.map(x=>x.key===key?{...x,qty}:x));
 const toggleWish=slug=>setWishlist(w=>w.includes(slug)?w.filter(x=>x!==slug):[...w,slug]);
 const total=useMemo(()=>cart.reduce((s,x)=>s+x.price*x.qty,0),[cart]);
 return <Ctx.Provider value={{cart,add,remove,update,total,wishlist,toggleWish}}>{children}</Ctx.Provider>
}
export const useStore=()=>useContext(Ctx);
