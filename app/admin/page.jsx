'use client';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const statuses=['Order Placed','Order Confirmed','Processing','Packed','Shipped','Out for Delivery','Delivered','Cancelled'];
const money=n=>`৳${Number(n||0).toLocaleString()}`;

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL &&
  (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  : null;

export default function AdminPage(){
 const [logged,setLogged]=useState(false),[password,setPassword]=useState(''),[data,setData]=useState(null),[error,setError]=useState(''),[connected,setConnected]=useState(false),[loading,setLoading]=useState(false);
 const load=async()=>{try{const r=await fetch('/api/admin/orders',{cache:'no-store'}); if(r.ok){setLogged(true); const j=await r.json(); setData(d=>({...d,...j}));} else if(r.status===401)setLogged(false); else setError('Could not load admin data')}catch{setError('Could not connect to the admin API')}};
 useEffect(()=>{load()},[]);
 useEffect(()=>{
   if(!logged || !supabase) return;
   const channel=supabase.channel('pure-roots-admin-events')
     .on('broadcast',{event:'admin_data_changed'},()=>load())
     .subscribe(status=>{setConnected(status==='SUBSCRIBED')});
   return()=>{supabase.removeChannel(channel)};
 },[logged]);
 const login=async()=>{setLoading(true);setError('');try{const r=await fetch('/api/admin/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password})});if(r.ok){setLogged(true);setPassword('');}else setError('Invalid admin password')}catch{setError('Could not connect to login service')}finally{setLoading(false)}};
 const updateStatus=async(id,status)=>{setError('');const r=await fetch('/api/admin/orders',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id,status})});if(!r.ok)setError('Could not update order')};
 const stats=data?.stats||{}; const orders=data?.orders||[]; const events=data?.events||[];
 const recent=useMemo(()=>events.slice(0,20),[events]);
 if(!logged)return <div className="section"><div className="container" style={{maxWidth:460}}><div className="summary"><h1>Pure Roots Admin</h1><p className="muted">Secure dashboard access</p><input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} placeholder="Admin password"/><button className="btn btn-primary" style={{marginTop:14,width:'100%'}} onClick={login} disabled={loading}>{loading?'Signing in…':'Sign in'}</button>{error&&<div className="notice" style={{marginTop:14,color:'var(--danger)'}}>{error}</div>}</div></div></div>;
 return <div className="section"><div className="container"><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,flexWrap:'wrap'}}><div><h1>Admin Dashboard</h1><p className="muted">Live Supabase data • no manual refresh required</p></div><div className="notice">{connected?'● Live':'○ Connecting…'}</div></div>
 <div className="form-grid" style={{marginTop:24}}>{[['Revenue',money(stats.revenue)],['Orders',stats.orders||0],['Customers',stats.customers||0],['Live Visitors',stats.activeVisitors||0],['Page Views',stats.pageViews||0]].map(([a,b])=><div className="summary" key={a}><div className="muted">{a}</div><div style={{fontSize:28,fontWeight:800,marginTop:6}}>{b}</div></div>)}</div>
 {error&&<div className="notice" style={{marginTop:18,color:'var(--danger)'}}>{error}</div>}
 <div style={{marginTop:30}}><h2>Orders</h2><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th align="left">Order</th><th align="left">Customer</th><th align="left">Phone</th><th align="left">Total</th><th align="left">Status</th><th align="left">Placed</th></tr></thead><tbody>{orders.map(o=><tr key={o.id} style={{borderTop:'1px solid #ddd'}}><td>{o.order_number}</td><td>{o.customer?.name||'—'}</td><td>{o.phone}</td><td>{money(o.total)}</td><td><select className="input" value={o.status} onChange={e=>updateStatus(o.id,e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></td><td>{new Date(o.placed_at).toLocaleString()}</td></tr>)}{!orders.length&&<tr><td colSpan="6" style={{padding:20}}>No orders yet.</td></tr>}</tbody></table></div></div>
 <div style={{marginTop:30}}><h2>Live Visitor Activity</h2><div className="summary"><p><strong>{stats.activeVisitors||0}</strong> active sessions in the last 2 minutes</p>{recent.map(e=><div key={e.id} style={{padding:'9px 0',borderTop:'1px solid #eee'}}><strong>{e.event_type}</strong> · {e.path} <span className="muted">· {new Date(e.created_at).toLocaleTimeString()}</span></div>)}</div></div>
 </div></div>;
}
