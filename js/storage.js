(function (root) {
'use strict';
const K='poolsense.scenes',all=()=>{try{return JSON.parse(localStorage.getItem(K))||{};}catch(e){return {};}};
root.PoolStore={
  list:()=>Object.keys(all()),
  load:n=>all()[n]||null,
  save(n,d){const a=all();a[n]=d;try{localStorage.setItem(K,JSON.stringify(a));return true;}catch(e){return false;}}
};
})(self);
