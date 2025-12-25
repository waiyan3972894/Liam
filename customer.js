import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCRjqWvCQRjij73KVcKIdCdyNb5jjlLSK8",
    authDomain: "mlbbbf.firebaseapp.com",
    projectId: "mlbbbf",
    storageBucket: "mlbbbf.firebasestorage.app",
    messagingSenderId: "725278425000",
    appId: "1:725278425000:web:09e91633b10c6e85c9679d"
};
const BOT_TOKEN = "8509262213:AAHTB8EIG2lLxMPLxQpRiTpEuMSF0G0AYPk";
const CHAT_ID = "7247933813";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

onSnapshot(query(collection(db, "products"), orderBy("createdAt", "desc")), (snap) => {
    const list = document.getElementById('product-list');
    list.innerHTML = "";
    snap.forEach(d => {
        const it = d.data();
        const id = d.id;
        let carouselItems = '';
        it.images.forEach((img, idx) => {
            carouselItems += `<div class="carousel-item ${idx===0?'active':''}"><img src="${img}" class="d-block w-100"></div>`;
        });

        const allImages = JSON.stringify(it.images);

        list.innerHTML += `
        <div class="col-md-4 col-6 product-item" data-category="${it.category}">
            <div class="card product-card shadow-sm mb-3 ${it.isSoldOut?'opacity-50':''}">
                <div id="caro${id}" class="carousel slide" data-bs-ride="carousel">
                    <div class="carousel-inner">${carouselItems}</div>
                </div>
                <div class="card-body p-2">
                    <h6 class="text-truncate fw-bold mb-1" style="font-size:0.9rem;">${it.name}</h6>
                    <p class="text-muted mb-2" style="font-size: 0.7rem; min-height: 2.2em; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${it.desc || 'အသေးစိတ်အချက်အလက် မရှိပါ။'}
                    </p>
                    <p class="text-danger fw-bold mb-2">${it.price.toLocaleString()} Ks</p>
                    <div class="d-flex gap-1">
                        <button class="btn btn-sm btn-outline-primary w-50" onclick='window.viewImages(${allImages})'>View</button>
                        <button class="btn btn-sm btn-primary w-50" ${it.isSoldOut?'disabled':''} onclick="window.openOrder('${it.name.replace(/'/g, "\\'")}')">
                            ${it.isSoldOut ? 'Sold' : 'Buy'}
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
    });
});

window.viewImages = (images) => {
    const body = document.getElementById('modalImageBody');
    body.innerHTML = images.map(url => `<img src="${url}" class="img-fluid rounded mb-2 w-100 shadow">`).join('');
    new bootstrap.Modal(document.getElementById('imageModal')).show();
};

window.openOrder = (name) => {
    document.getElementById('modalItemName').value = name;
    document.getElementById('displayItemName').value = name;
    new bootstrap.Modal(document.getElementById('orderModal')).show();
};

document.getElementById('orderForm').onsubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button'); btn.disabled = true;
    const fd = new FormData();
    fd.append("chat_id", CHAT_ID);
    fd.append("photo", document.getElementById('slipFile').files[0]);
    fd.append("caption", `🛒 *Order Notification*\n📦 Item: ${document.getElementById('modalItemName').value}\n👤 Name: ${document.getElementById('cusName').value}\n📞 Phone: ${document.getElementById('cusPhone').value}\n🎮 Info: ${document.getElementById('gameInfo').value}`);
    fd.append("parse_mode", "Markdown");
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, { method: "POST", body: fd });
        alert("အော်ဒါတင်ပြီးပါပြီ။"); location.reload();
    } catch { alert("Error!"); btn.disabled = false; }
};
