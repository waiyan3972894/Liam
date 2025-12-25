import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, onSnapshot, query, orderBy, updateDoc, increment } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCRjqWvCQRjij73KVcKIdCdyNb5jjlLSK8",
    authDomain: "mlbbbf.firebaseapp.com",
    projectId: "mlbbbf",
    storageBucket: "mlbbbf.firebasestorage.app",
    messagingSenderId: "725278425000",
    appId: "1:725278425000:web:09e91633b10c6e85c9679d"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const BOT_TOKEN = "YOUR_BOT_TOKEN";
const CHAT_ID = "YOUR_CHAT_ID";
let userData = null;

// Auth State Check
onAuthStateChanged(auth, (user) => {
    const authSec = document.getElementById('auth-section');
    const mainSec = document.getElementById('main-content');
    if (user) {
        authSec.style.display = 'none';
        mainSec.style.display = 'block';
        onSnapshot(doc(db, "users", user.uid), (d) => {
            if (d.exists()) {
                userData = d.data();
                document.getElementById('wallet-balance').innerText = (userData.balance || 0).toLocaleString();
                document.getElementById('user-display').innerText = userData.name;
            }
        });
        loadProducts();
    } else {
        authSec.style.display = 'block';
        mainSec.style.display = 'none';
    }
});

// Load Products with Real-time Support
function loadProducts() {
    onSnapshot(query(collection(db, "products"), orderBy("createdAt", "desc")), (snap) => {
        const list = document.getElementById('product-list');
        list.innerHTML = "";
        snap.forEach(d => {
            const it = d.data();
            const sP = it.price;
            const ogP = it.originalPrice || 0;
            const imgJson = JSON.stringify(it.images).replace(/"/g, '&quot;');
            
            let badge = (ogP > sP) ? `<div class="discount-badge">${Math.round(((ogP - sP) / ogP) * 100)}% OFF</div>` : "";
            let priceHTML = (ogP > sP) 
                ? `<div class="mb-2"><span class="text-muted small text-decoration-line-through me-1">${ogP.toLocaleString()} Ks</span><span class="text-danger fw-bold">${sP.toLocaleString()} Ks</span></div>`
                : `<div class="text-primary fw-bold mb-2">${sP.toLocaleString()} Ks</div>`;

            const isAvailable = !it.isSoldOut && it.stock > 0;
            const buyBtn = isAvailable 
                ? `<button class="btn btn-sm btn-primary w-50 fw-bold shadow-sm" onclick="window.openOrder('${it.name.replace(/'/g, "\\'")}', ${sP}, '${d.id}', '${it.category}')">BUY</button>`
                : `<button class="btn btn-sm btn-secondary w-50" disabled>SOLD OUT</button>`;

            list.innerHTML += `
            <div class="col-md-4 col-6 product-item" data-category="${it.category}">
                <div class="card product-card shadow-sm border-0">
                    ${badge}
                    <img src="${it.images[0]}" class="main-img">
                    <div class="card-body p-2 text-center text-dark">
                        <h6 class="text-truncate fw-bold mb-1 small">${it.name}</h6>
                        <div class="small text-muted mb-1" style="font-size:0.75rem;">Stock: ${it.stock}</div>
                        ${priceHTML}
                        <div class="d-flex gap-1 mt-2">
                            <button class="btn btn-sm btn-outline-secondary w-50">VIEW</button>
                            ${buyBtn}
                        </div>
                    </div>
                </div>
            </div>`;
        });
    });
}

// Category Filter Logic (အခု အားလုံး ရွေးလို့ရပါပြီ)
window.filterCat = (cat, btn) => {
    document.querySelectorAll('#cat-bar .btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    document.querySelectorAll('.product-item').forEach(item => {
        const itemCat = item.getAttribute('data-category');
        if (cat === "All" || itemCat === cat) {
            item.style.display = "block";
        } else {
            item.style.display = "none";
        }
    });
};

// Order Modal Setup
window.openOrder = (name, price, id, cat) => {
    document.getElementById('modalItemName').value = name;
    document.getElementById('displayItemName').value = name;
    document.getElementById('modalItemPrice').value = price;
    document.getElementById('modalProdId').value = id;
    document.getElementById('modalCatName').value = cat;

    // Robux စစ်ဆေးခြင်း
    document.getElementById('robuxInputs').style.display = (cat === "Robux") ? "block" : "none";
    document.getElementById('p_wallet').checked = true;
    document.getElementById('directPayDetails').style.display = "none";
    
    new bootstrap.Modal(document.getElementById('orderModal')).show();
};

// Order Submit
document.getElementById('orderForm').onsubmit = async (e) => {
    e.preventDefault();
    const payType = document.querySelector('input[name="payType"]:checked').value;
    const price = Number(document.getElementById('modalItemPrice').value);
    const prodId = document.getElementById('modalProdId').value;
    const cat = document.getElementById('modalCatName').value;

    if (payType === "Wallet" && userData.balance < price) return alert("❌ Balance မလုံလောက်ပါ။");
    
    const btn = document.getElementById('orderBtn');
    btn.disabled = true; btn.innerText = "Processing...";

    try {
        let caption = `🛒 *New Order*\n📦 Item: ${document.getElementById('modalItemName').value}\n💰 Price: ${price} Ks\n💳 Method: ${payType}\n👤 Name: ${document.getElementById('cusName').value}\n📞 Phone: ${document.getElementById('cusPhone').value}\n🎮 Info: ${document.getElementById('gameInfo').value}`;
        
        if (cat === "Robux") {
            caption += `\n\n🔑 *Roblox Account*\nUser: \`${document.getElementById('rbxUser').value}\`\nPass: \`${document.getElementById('rbxPass').value}\``;
        }
        caption += `\n💬 TG: ${userData.telegram}`;

        if (payType === "Direct") {
            const slip = document.getElementById('orderSlip').files[0];
            if (!slip) throw new Error("ပြေစာပုံ ထည့်ပေးပါ။");
            const fd = new FormData();
            fd.append("chat_id", CHAT_ID); fd.append("photo", slip); fd.append("caption", caption); fd.append("parse_mode", "Markdown");
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, { method: "POST", body: fd });
        } else {
            // Wallet Pay
            await updateDoc(doc(db, "users", auth.currentUser.uid), { balance: increment(-price) });
            await updateDoc(doc(db, "products", prodId), { stock: increment(-1) });
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: "POST", headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: CHAT_ID, text: caption, parse_mode: "Markdown" })
            });
        }
        alert("✅ Success!"); location.reload();
    } catch (err) { alert(err.message); btn.disabled = false; }
};

// Login/Register Actions
document.getElementById('login-form').onsubmit = (e) => { e.preventDefault(); signInWithEmailAndPassword(auth, document.getElementById('login-email').value, document.getElementById('login-pass').value); };
document.getElementById('reg-form').onsubmit = async (e) => {
    e.preventDefault();
    const res = await createUserWithEmailAndPassword(auth, document.getElementById('reg-email').value, document.getElementById('reg-pass').value);
    await setDoc(doc(db, "users", res.user.uid), { name: document.getElementById('reg-name').value, telegram: document.getElementById('reg-tg').value, balance: 0, uid: res.user.uid });
};
document.getElementById('logout-btn').onclick = () => signOut(auth);
