// ========== Firebase Imports ==========
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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
const db = getFirestore(app);

// ========== Toast Notification ==========
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => { toast.className = 'toast'; }, 3000);
}

// ========== Format Price ==========
function formatPrice(price) {
  return new Intl.NumberFormat('ar-DZ').format(price);
}

// ========== Load Products ==========
async function loadProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  try {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    grid.innerHTML = '';

    if (snapshot.empty) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="icon">👗</div>
          <h3>لا توجد منتجات حالياً</h3>
          <p>سيتم إضافة تشكيلة جديدة قريباً، ترقبونا!</p>
        </div>`;
      return;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="card-img">
          <img src="${data.imageUrl}" alt="${data.name}" loading="lazy">
          ${data.badge ? `<span class="badge">${data.badge}</span>` : ''}
          <div class="card-overlay">
            ${data.name ? `<h3>${data.name}</h3>` : ''}
            ${data.price ? `<div class="price">${formatPrice(data.price)} <small>دج</small></div>` : ''}
          </div>
        </div>
      `;
      // Click/tap: toggle overlay on mobile, open lightbox on double-tap or long hold
      card.addEventListener('touchstart', () => {
        document.querySelectorAll('.product-card.active').forEach(c => { if (c !== card) c.classList.remove('active'); });
        card.classList.toggle('active');
      }, { passive: true });

      // Click on image opens lightbox
      const img = card.querySelector('img');
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        openLightbox(data.imageUrl, data.name || '');
      });
      img.style.cursor = 'zoom-in';

      grid.appendChild(card);
    });

    // Animate cards on scroll
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animationPlayState = 'running';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.product-card').forEach(card => {
      card.style.animationPlayState = 'paused';
      observer.observe(card);
    });

  } catch (error) {
    console.error('Error loading products:', error);
    grid.innerHTML = `
      <div class="empty-state">
        <div class="icon">⚠️</div>
        <h3>حدث خطأ في تحميل المنتجات</h3>
        <p>يرجى تحديث الصفحة أو المحاولة لاحقاً</p>
      </div>`;
  }
}

// ========== Lightbox ==========
const lightbox   = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');

function openLightbox(src, alt) {
  lightboxImg.src = src;
  lightboxImg.alt = alt || '';
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(() => { lightboxImg.src = ''; }, 300);
}

lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
lightboxClose.addEventListener('click', closeLightbox);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

// ========== PWA Install ==========
let deferredPrompt = null;
const installBtn = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) installBtn.style.display = 'flex';
});

if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.style.display = 'none';
  });
}

window.addEventListener('appinstalled', () => {
  if (installBtn) installBtn.style.display = 'none';
  deferredPrompt = null;
});

// ========== Smooth Scroll for Nav ==========
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const targetId = link.getAttribute('href');
    if (targetId === '#') return;
    e.preventDefault();
    const el = document.querySelector(targetId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ========== Init ==========
loadProducts();
