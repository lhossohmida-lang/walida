// ========== Firebase Imports ==========
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
// تم إيقاف استخدام Firebase Storage واستبداله بـ ImgBB المجاني

// ========== Firebase Config ==========
const firebaseConfig = {
  apiKey: "AIzaSyA0e0eLDnutv9MEcbJDcQdHkKfbKJ8stpg",
  authDomain: "walida-29959.firebaseapp.com",
  projectId: "walida-29959",
  storageBucket: "walida-29959.firebasestorage.app",
  messagingSenderId: "675458662515",
  appId: "1:675458662515:web:67e131ed7712ff66cc2a06",
  measurementId: "G-HCJX1W6CZY"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// const storage = getStorage(app); // تم الإيقاف

// ========== DOM Elements ==========
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const uploadBtn = document.getElementById('upload-btn');
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('dress-image');
const fileNameDisplay = document.getElementById('file-name-display');
const imagePreview = document.getElementById('image-preview');

let selectedFile = null;

// ========== Toast ==========
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => { toast.className = 'toast'; }, 3500);
}

// ========== Format Helpers ==========
function formatPrice(price) {
  return new Intl.NumberFormat('ar-DZ').format(price);
}

function formatDate(timestamp) {
  if (!timestamp) return '—';
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toLocaleDateString('ar-DZ', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ========== Auth State Listener ==========
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    loadDashboardData();
  } else {
    loginSection.style.display = 'flex';
    dashboardSection.style.display = 'none';
  }
});

// ========== Login ==========
loginBtn.addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!email || !password) {
    showToast('يرجى ملء جميع الحقول', 'error');
    return;
  }

  loginBtn.disabled = true;
  loginBtn.innerHTML = 'جاري الدخول... <span class="spinner"></span>';

  try {
    await signInWithEmailAndPassword(auth, email, password);
    showToast('تم تسجيل الدخول بنجاح ✓');
  } catch (error) {
    console.error(error);
    let msg = 'خطأ في تسجيل الدخول';
    if (error.code === 'auth/invalid-credential') msg = 'البريد أو كلمة المرور غير صحيحة';
    else if (error.code === 'auth/too-many-requests') msg = 'محاولات كثيرة، حاول لاحقاً';
    showToast(msg, 'error');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'تسجيل الدخول';
  }
});

// Enter key to login
document.getElementById('password').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loginBtn.click();
});

// ========== Logout ==========
logoutBtn.addEventListener('click', async () => {
  await signOut(auth);
  showToast('تم تسجيل الخروج');
});

// ========== PWA Install (Admin) ==========
let adminDeferredPrompt = null;
const adminInstallBtn = document.getElementById('admin-install-btn');
const installedBadge  = document.getElementById('installed-badge');

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  adminDeferredPrompt = e;
  if (adminInstallBtn) adminInstallBtn.style.display = 'inline-flex';
});

if (adminInstallBtn) {
  adminInstallBtn.addEventListener('click', async () => {
    if (!adminDeferredPrompt) return;
    adminDeferredPrompt.prompt();
    const { outcome } = await adminDeferredPrompt.userChoice;
    adminDeferredPrompt = null;
    if (outcome === 'accepted') {
      adminInstallBtn.style.display = 'none';
      if (installedBadge) installedBadge.style.display = 'inline-flex';
      showToast('تم تثبيت التطبيق بنجاح ✓');
    }
  });
}

window.addEventListener('appinstalled', () => {
  adminDeferredPrompt = null;
  if (adminInstallBtn) adminInstallBtn.style.display = 'none';
  if (installedBadge)  installedBadge.style.display  = 'inline-flex';
});

// ========== File Upload Area ==========
uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = 'var(--gold)';
  uploadArea.style.background = 'rgba(212,168,83,0.05)';
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.style.borderColor = '';
  uploadArea.style.background = '';
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = '';
  uploadArea.style.background = '';
  if (e.dataTransfer.files.length > 0) {
    handleFileSelect(e.dataTransfer.files[0]);
  }
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFileSelect(e.target.files[0]);
  }
});

function handleFileSelect(file) {
  if (!file.type.startsWith('image/')) {
    showToast('يرجى اختيار ملف صورة فقط', 'error');
    return;
  }
  selectedFile = file;
  fileNameDisplay.textContent = `📎 ${file.name}`;
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.src = e.target.result;
    imagePreview.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

// ========== Upload Product ==========
uploadBtn.addEventListener('click', async () => {
  const name = document.getElementById('dress-name').value.trim();
  const price = document.getElementById('dress-price').value.trim();

  if (!selectedFile) {
    showToast('يرجى اختيار صورة أولاً', 'error');
    return;
  }

  uploadBtn.disabled = true;
  uploadBtn.innerHTML = 'جاري الرفع... <span class="spinner"></span>';

  try {
    // 1. ضغط الصورة لتصغير حجمها وتحويلها إلى نص (Base64) لحفظها في قاعدة البيانات مباشرة
    // هذا الحل مضمون 100% ولا يحتاج لأي مفاتيح أو اشتراكات خارجية!
    const compressedImage = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // تصغير الأبعاد (أقصى 600 بكسل لضمان البقاء تحت حد Firestore 1MB)
          const MAX = 600;
          if (width > MAX || height > MAX) {
            const ratio = Math.min(MAX / width, MAX / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // ضغط تدريجي حتى تصبح الصورة < 800KB
          let quality = 0.7;
          let result = canvas.toDataURL('image/jpeg', quality);
          while (result.length > 800 * 1024 && quality > 0.2) {
            quality -= 0.1;
            result = canvas.toDataURL('image/jpeg', quality);
          }
          resolve(result);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });

    // 2. حفظ تفاصيل الفستان مع الصورة المضغوطة في Firebase Database
    await addDoc(collection(db, 'products'), {
      name: name || '',
      price: price ? Number(price) : 0,
      imageUrl: compressedImage,
      imagePath: 'local-compressed',
      badge: '',
      createdAt: serverTimestamp()
    });

    showToast('تم رفع المنتج بنجاح ✓');

    // Reset form
    document.getElementById('dress-name').value = '';
    document.getElementById('dress-price').value = '';
    selectedFile = null;
    fileNameDisplay.textContent = '';
    imagePreview.style.display = 'none';
    fileInput.value = '';

    // Refresh data
    loadDashboardData();

  } catch (error) {
    console.error('Upload error:', error);
    showToast('حدث خطأ أثناء الرفع: ' + error.message, 'error');
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.textContent = 'رفع المنتج للمتجر';
  }
});

// ========== Load Dashboard Data ==========
async function loadDashboardData() {
  await Promise.all([loadProducts(), loadOrders()]);
}

// ========== Load Products Table ==========
async function loadProducts() {
  const tbody = document.getElementById('products-tbody');
  const totalEl = document.getElementById('total-products');

  try {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    totalEl.textContent = snapshot.size;
    tbody.innerHTML = '';

    if (snapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem;">لا توجد منتجات بعد</td></tr>';
      return;
    }

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><img src="${data.imageUrl}" alt="${data.name}" class="thumb"></td>
        <td>${data.name}</td>
        <td>${formatPrice(data.price)} دج</td>
        <td>${formatDate(data.createdAt)}</td>
        <td><button class="btn-sm delete" data-id="${docSnap.id}">🗑️ حذف</button></td>
      `;
      tbody.appendChild(tr);
    });

    // Attach delete handlers
    tbody.querySelectorAll('.btn-sm.delete').forEach(btn => {
      btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
    });

  } catch (error) {
    console.error('Error loading products:', error);
  }
}

// ========== Delete Product ==========
async function deleteProduct(id) {
  if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

  try {
    await deleteDoc(doc(db, 'products', id));
    showToast('تم حذف المنتج ✓');
    loadDashboardData();
  } catch (error) {
    console.error('Delete error:', error);
    showToast('خطأ في حذف المنتج', 'error');
  }
}

// ========== Load Orders Table ==========
async function loadOrders() {
  const tbody = document.getElementById('orders-tbody');
  const totalOrders = document.getElementById('total-orders');
  const totalRevenue = document.getElementById('total-revenue');

  try {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    totalOrders.textContent = snapshot.size;
    let revenue = 0;

    tbody.innerHTML = '';

    if (snapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem;">لا توجد طلبات بعد</td></tr>';
      totalRevenue.textContent = '0';
      return;
    }

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.price) revenue += Number(data.price);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${data.dressName || '—'}</td>
        <td>${data.customerName || '—'}</td>
        <td>${data.phone || '—'}</td>
        <td>${data.status || 'جديد'}</td>
        <td>${formatDate(data.createdAt)}</td>
      `;
      tbody.appendChild(tr);
    });

    totalRevenue.textContent = formatPrice(revenue);

  } catch (error) {
    console.error('Error loading orders:', error);
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem;">خطأ في تحميل الطلبات</td></tr>';
  }
}
